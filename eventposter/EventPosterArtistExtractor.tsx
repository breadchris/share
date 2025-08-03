import React, { useState, useRef } from "https://esm.sh/react@18";
import { Camera, Upload, Check, X, ArrowLeft, Music, Play, Pause, Eye, Loader2, AlertCircle, Stars, ExternalLink, Clock, Users, Disc, Headphones, Shield, Database, Zap } from "https://esm.sh/lucide-react@0.263.1";
import * as API from './api';

interface Artist {
  name: string;
  confidence: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  spotify_url: string;
  preview_url?: string;
  image_url?: string;
  duration_ms: number;
  popularity: number;
}

interface EventData {
  event_name: string;
  event_date?: string;
  venue?: string;
  artists: Artist[];
  tracks: SpotifyTrack[];
  poster_url: string;
}

interface AnalyzePosterResponse {
  event_name: string;
  event_date?: string;
  venue?: string;
  artists: Artist[];
  raw_text: string;
  success: boolean;
  error?: string;
}

interface EventPosterState {
  screen: 'upload' | 'cache-choice' | 'analysis' | 'enhanced-results' | 'save' | 'success';
  posterImage: string | null;
  imageFile: File | null;
  analysisResult: AnalyzePosterResponse | null;
  enhancedResult: API.EnhancedAnalysisResponse | null;
  eventData: EventData | null;
  status: 'idle' | 'checking-cache' | 'analyzing' | 'searching' | 'saving' | 'error';
  error: string | null;
  cacheResult: API.CheckCacheResponse | null;
}

const EventPosterArtistExtractor: React.FC = () => {
  const [state, setState] = useState<EventPosterState>({
    screen: 'upload',
    posterImage: null,
    imageFile: null,
    analysisResult: null,
    enhancedResult: null,
    eventData: null,
    status: 'idle',
    error: null,
    cacheResult: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const resetState = () => {
    setState({
      screen: 'upload',
      posterImage: null,
      imageFile: null,
      analysisResult: null,
      enhancedResult: null,
      eventData: null,
      status: 'idle',
      error: null,
      cacheResult: null,
    });
    setPlayingTrack(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setState(prev => ({
        ...prev,
        posterImage: imageUrl,
        imageFile: file,
        status: 'checking-cache',
      }));

      // Convert to base64 for API
      const base64Data = imageUrl.split(',')[1];
      const mimeType = file.type;

      try {
        // First check if we have cached results
        const cacheResponse = await API.CheckCache({
          image_data: base64Data,
          mime_type: mimeType,
        });

        if (cacheResponse.data.success && cacheResponse.data.has_cache && cacheResponse.data.cached_result) {
          // Found cached data - show choice screen
          setState(prev => ({
            ...prev,
            cacheResult: cacheResponse.data,
            screen: 'cache-choice',
            status: 'idle',
          }));
        } else {
          // No cache found - proceed with analysis
          await performAnalysis(base64Data, mimeType);
        }
      } catch (error) {
        // If cache check fails, proceed with analysis anyway
        await performAnalysis(base64Data, mimeType);
      }
    };
    reader.readAsDataURL(file);
  };

  const performAnalysis = async (base64Data: string, mimeType: string) => {
    setState(prev => ({
      ...prev,
      screen: 'analysis',
      status: 'analyzing',
    }));

    try {
      const response = await API.EnhancedAnalysis({
        image_data: base64Data,
        mime_type: mimeType,
      });

      if (response.data.success) {
        setState(prev => ({
          ...prev,
          analysisResult: response.data.event_analysis,
          enhancedResult: response.data,
          screen: 'enhanced-results',
          status: 'idle',
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: response.data.error || 'Analysis failed',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Enhanced analysis failed',
      }));
    }
  };

  const useCachedResults = () => {
    if (!state.cacheResult?.cached_result) return;
    
    setState(prev => ({
      ...prev,
      analysisResult: state.cacheResult!.cached_result!.event_analysis,
      enhancedResult: state.cacheResult!.cached_result!,
      screen: 'enhanced-results',
      status: 'idle',
    }));
  };

  const reprocessPoster = async () => {
    if (!state.imageFile) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      const base64Data = imageUrl.split(',')[1];
      const mimeType = state.imageFile!.type;
      await performAnalysis(base64Data, mimeType);
    };
    reader.readAsDataURL(state.imageFile);
  };

  // Spotify search is now integrated into enhanced analysis

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) return;

    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.preview_url;
        audioRef.current.play();
        setPlayingTrack(track.id);
      }
    }
  };

  const saveEventData = async () => {
    if (!state.enhancedResult || !state.analysisResult) return;

    setState(prev => ({ ...prev, status: 'saving' }));

    const eventData: EventData = {
      event_name: state.analysisResult.event_name,
      event_date: state.analysisResult.event_date,
      venue: state.analysisResult.venue,
      artists: state.analysisResult.artists,
      tracks: state.enhancedResult.spotify_tracks,
      poster_url: state.posterImage || '',
    };

    try {
      const response = await API.SaveEventData({
        event_data: eventData,
        spreadsheet_id: 'default', // This would come from user selection
      });

      if (response.data.success) {
        setState(prev => ({
          ...prev,
          eventData,
          screen: 'success',
          status: 'idle',
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: response.data.error || 'Save failed',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Save failed',
      }));
    }
  };

  const renderUploadScreen = () => (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="aspect-square bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
          {state.posterImage ? (
            <img 
              src={state.posterImage} 
              alt="Event Poster" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-2" />
              <p>Upload event poster</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center text-lg"
        >
          <Camera className="w-6 h-6 mr-2" />
          Take Photo
        </button>
        
        <button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
              fileInputRef.current.setAttribute('capture', 'environment');
            }
          }}
          className="w-full bg-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center"
        >
          <Upload className="w-5 h-5 mr-2" />
          Choose from Gallery
        </button>
      </div>
    </div>
  );

  const renderCacheChoiceScreen = () => {
    if (!state.cacheResult || !state.cacheResult.cached_result) return null;
    
    const cachedResult = state.cacheResult.cached_result;

    return (
      <div className="p-4 space-y-6">
        {/* Poster Preview */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="aspect-video">
            <img 
              src={state.posterImage || ''} 
              alt="Event Poster" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Cache Found Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-green-900">Poster Already Processed!</h2>
          </div>
          <p className="text-green-700 mb-4">
            We found existing analysis for this poster from {state.cacheResult.cached_at}. 
            You can use the cached results or reprocess to get fresh data.
          </p>
          
          {/* Quick Preview of Cached Results */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Cached Results Preview:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-medium">{cachedResult.verified_artists.length}</div>
                <div className="text-gray-600">Artists</div>
              </div>
              <div className="text-center">
                <Music className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="font-medium">{cachedResult.spotify_tracks.length}</div>
                <div className="text-gray-600">Tracks</div>
              </div>
              <div className="text-center">
                <Disc className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="font-medium">{cachedResult.total_dj_sets}</div>
                <div className="text-gray-600">DJ Sets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-3">
          <button
            onClick={useCachedResults}
            className="w-full bg-green-600 text-white font-medium py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center text-lg"
          >
            <Database className="w-6 h-6 mr-2" />
            Use Cached Results
          </button>
          
          <button
            onClick={reprocessPoster}
            className="w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center text-lg"
          >
            <Zap className="w-6 h-6 mr-2" />
            Reprocess with AI
          </button>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 text-center">
            <strong>Tip:</strong> Use cached results for instant access or reprocess to get the latest music data.
          </p>
        </div>
      </div>
    );
  };

  const renderAnalysisScreen = () => (
    <div className="p-4 space-y-6">
      {/* Poster Preview */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="aspect-video">
          <img 
            src={state.posterImage || ''} 
            alt="Event Poster" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Analysis Results */}
      {state.status === 'checking-cache' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 mr-3 animate-spin" />
            <span className="text-lg">Checking for existing analysis...</span>
          </div>
        </div>
      ) : state.status === 'analyzing' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 mr-3 animate-spin" />
            <span className="text-lg">Analyzing poster with AI...</span>
          </div>
        </div>
      ) : state.analysisResult ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Event Details</h2>
          
          {state.analysisResult.event_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Name</label>
              <p className="text-lg">{state.analysisResult.event_name}</p>
            </div>
          )}

          {state.analysisResult.venue && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Venue</label>
              <p className="text-lg">{state.analysisResult.venue}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artists Found ({state.analysisResult.artists.length})
            </label>
            <div className="space-y-2">
              {state.analysisResult.artists.map((artist, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{artist.name}</span>
                  <div className="flex items-center">
                    <Stars className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">
                      {Math.round(artist.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-gray-600">
            <p>Analysis complete! Searching Spotify and 1001tracklists...</p>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderEnhancedResultsScreen = () => {
    if (!state.enhancedResult) return null;

    const { verified_artists, spotify_tracks, dj_sets, total_dj_sets } = state.enhancedResult;

    return (
      <div className="p-4 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{verified_artists.length}</div>
            <div className="text-sm text-gray-600">Artists</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <Music className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{spotify_tracks.length}</div>
            <div className="text-sm text-gray-600">Tracks</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <Disc className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{total_dj_sets}</div>
            <div className="text-sm text-gray-600">DJ Sets</div>
          </div>
        </div>

        {/* Artist Verification */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="w-6 h-6 text-green-600 mr-2" />
            Artist Verification
          </h2>
          
          <div className="space-y-4">
            {verified_artists.map((artist, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">{artist.poster_name}</h3>
                    {artist.is_verified ? (
                      <Check className="w-5 h-5 text-green-600 ml-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {artist.has_dj_sets && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {artist.dj_set_count} DJ sets
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      artist.is_verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {Math.round(artist.match_confidence * 100)}% match
                    </span>
                  </div>
                </div>

                {artist.best_match && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <strong>Best Spotify match:</strong> {artist.best_match.artist_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {artist.best_match.tracks.length} tracks found
                    </p>
                  </div>
                )}

                {artist.dj_sets && artist.dj_sets.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent DJ Sets:</p>
                    <div className="space-y-2">
                      {artist.dj_sets.slice(0, 2).map((djSet, setIndex) => (
                        <div key={setIndex} className="bg-gray-50 rounded p-2">
                          <a 
                            href={djSet.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {djSet.title}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Eye className="w-3 h-3 mr-1" />
                            {djSet.view_count.toLocaleString()} views
                            {djSet.duration && (
                              <>
                                <Clock className="w-3 h-3 ml-2 mr-1" />
                                {djSet.duration}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Spotify Tracks */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Headphones className="w-6 h-6 text-green-600 mr-2" />
            Spotify Tracks ({spotify_tracks.length})
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {spotify_tracks.map((track) => (
              <div key={track.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {track.image_url && (
                  <img 
                    src={track.image_url} 
                    alt={track.album}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{track.name}</p>
                  <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                  <p className="text-xs text-gray-400 truncate">{track.album}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {track.preview_url && (
                    <button
                      onClick={() => playPreview(track)}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                      {playingTrack === track.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveEventData}
            disabled={state.status === 'saving'}
            className="w-full mt-6 bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center text-lg"
          >
            {state.status === 'saving' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Event Data...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save Event & Playlist
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSuccessScreen = () => (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Event Saved Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Your event and playlist have been saved to your collection.
        </p>
        
        {state.eventData && (
          <div className="text-left space-y-2 mb-6">
            <p><strong>Event:</strong> {state.eventData.event_name}</p>
            <p><strong>Artists:</strong> {state.eventData.artists.length}</p>
            <p><strong>Tracks Found:</strong> {state.eventData.tracks.length}</p>
          </div>
        )}

        <button
          onClick={resetState}
          className="w-full bg-blue-600 text-white font-medium py-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Analyze Another Poster
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {state.screen !== 'upload' && (
            <button
              onClick={() => {
                if (state.screen === 'analysis' || state.screen === 'cache-choice') {
                  resetState();
                } else if (state.screen === 'enhanced-results') {
                  // Go back based on whether we came from cache or analysis
                  if (state.cacheResult) {
                    setState(prev => ({ ...prev, screen: 'cache-choice' }));
                  } else {
                    setState(prev => ({ ...prev, screen: 'analysis' }));
                  }
                } else {
                  setState(prev => ({ ...prev, screen: 'enhanced-results' }));
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Event Poster Extractor
            </h1>
          </div>
          
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {state.screen === 'upload' && renderUploadScreen()}
        {state.screen === 'cache-choice' && renderCacheChoiceScreen()}
        {state.screen === 'analysis' && renderAnalysisScreen()}
        {state.screen === 'enhanced-results' && renderEnhancedResultsScreen()}
        {state.screen === 'success' && renderSuccessScreen()}

        {/* Status Display */}
        {state.status === 'error' && state.error && (
          <div className="p-4">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 font-medium">{state.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio element for preview playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrack(null)}
        onError={() => setPlayingTrack(null)}
      />
    </div>
  );
};

export default EventPosterArtistExtractor;