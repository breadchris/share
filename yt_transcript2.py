#!/usr/bin/env python3
import os, sys

here = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(here, "python"))

import argparse
from datetime import timedelta
from typing import Dict, Optional, Tuple, List
from types import SimpleNamespace
import yt_dlp
from yt_dlp.utils import YoutubeDLError
import json
import os
import webvtt
import re
import gzip
import urllib.request

def get(url):
    with urllib.request.urlopen(url) as resp:
        return SimpleNamespace(
            status_code=resp.getcode(),
            text=resp.read().decode(),
            headers=dict(resp.getheaders()),
        )

CACHE_DIR = 'data/yt'

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR, exist_ok=True)
    if not os.path.isdir(CACHE_DIR):
        raise ValueError(f'{CACHE_DIR} is not a directory')

def validate_youtube_url(url: str) -> bool:
    try:
        video_id = yt_dlp.extractor.youtube.YoutubeIE.extract_id(url)
        return True
    except YoutubeDLError:
        return False

class VideoExtractor:
    def __init__(self, proxy: Optional[str] = None):
        ensure_cache_dir()

        self.ydl_opts = {
            'writesubtitles': True,
            'writeannotations': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en', 'en-US', 'en-CA'],  # Focus on English captions for now
            'skip_download': True,  # Don't download the video file
            'quiet': True,
            'no_warnings': False,
            'no-playlist': True
        }

        if proxy:
            # print(f'Setting proxy: {proxy[:10]}...')
            self.ydl_opts['proxy'] = proxy

    def get_captions_by_priority(self, info: Dict) -> Optional[Dict]:
        """
        Get captions based on priority order:
        1. Manual subtitles (en-US, en-CA, en-*)
        2. Automatic captions (en-orig, en-US, en-CA, en)
        
        Args:
            info: Video information dictionary from yt-dlp
            
        Returns:
            Caption json blob (fields ext, url, name)
        """
        # Priority order for subtitle languages
        subtitle_priorities = ['en-US', 'en-CA', 'en']
        auto_caption_priorities = ['en-orig', 'en-US', 'en-CA', 'en']
        format_priorities = ['vtt', 'srt', 'ttml']
        
        caption_track = None

        # Check manual subtitles first
        if info.get('subtitles'):
            # Check specific language variants first
            for lang in subtitle_priorities:
                if lang in info['subtitles']:
                    caption_track = info['subtitles'][lang]
                    break
            
            # Then check for any other en-* variants
            else:
                for lang in info['subtitles'].keys():
                    if lang.startswith('en-'):
                        caption_track = info['subtitles'][lang]
                        break

        # Check automatic captions if no manual subtitles found
        if not caption_track:
            if info.get('automatic_captions'):
                for lang in auto_caption_priorities:
                    if lang in info['automatic_captions']:
                        caption_track = info['automatic_captions'][lang]
                        break

        if not caption_track:
            return None

        # Find the preferred format
        for format in format_priorities:
            for track in caption_track:
                if not 'name' in track or track.get('protocol') == 'm3u8_native': # skip weird m3u8 captions
                    continue
                if track.get('ext') == format:
                    return track
        
        # If no compatible format found, fail
        return None

    def download_captions(self, video_id: str, caption_obj: Dict) -> str:
        ext = caption_obj['ext']
        url = caption_obj['url']
        cache_file = os.path.join(CACHE_DIR, video_id + '.' + ext + '.gz')

        if os.path.isfile(cache_file):
            return gzip.open(cache_file, 'rt').read()

        # Download caption content
        response = get(url)
        if response.status_code != 200:
            raise ValueError(f"Failed to download captions: {response.status_code}")
        content = response.text

        with gzip.open(cache_file, 'wt') as f:
            f.write(content)

        return content

    def _timestamp_to_seconds(self, timestamp: str) -> float:
        """
        Convert WebVTT timestamp to seconds.
        
        Args:
            timestamp: WebVTT timestamp in format "HH:MM:SS.mmm"
            
        Returns:
            Float representing total seconds
        """
        time_parts = timestamp.split(':')
        hours = float(time_parts[0])
        minutes = float(time_parts[1])
        seconds = float(time_parts[2])
        
        return hours * 3600 + minutes * 60 + seconds

    def _seconds_to_timestamp(self, total_seconds: float) -> str:
        """
        Convert seconds to WebVTT timestamp.
        
        Args:
            total_seconds: Float representing total seconds
                
        Returns:
            WebVTT timestamp in format "HH:MM:SS.mmm"
        """
        hours = int(total_seconds // 3600)
        remaining = total_seconds % 3600
        minutes = int(remaining // 60)
        seconds = remaining % 60
        
        # Format with leading zeros and exactly 3 decimal places
        return f"{hours:02d}:{minutes:02d}:{seconds:06.3f}"

    # because webvtt's shit doesn't include fractional part (the milliseconds), causing fucking problems !!
    def _ts_to_secs(self, timestamp):
        return timestamp.in_seconds() + (timestamp.milliseconds / 1000)

    # adapted from https://github.com/bindestriche/srt_fix/blob/5b4442a8cdcae06c53545f4d0c99c3e624416919/simplesrt.py#L132C1-L201C28
    def dedupe_yt_captions(self, subs_iter):
        previous_subtitle = None
        text = ""
        for subtitle in subs_iter:

            if previous_subtitle is None: # first interation set previous subtitle for comparison
                 previous_subtitle = subtitle
                 continue

            subtitle.text = subtitle.text.strip() # remove trailing linebreaks

            if len(subtitle.text) == 0:  # skip over empty subtitles
                continue

            if (self._ts_to_secs(subtitle.start_time) - self._ts_to_secs(subtitle.end_time) < 0.15 and # very short
                    subtitle.text in previous_subtitle.text ): # same text as previous
                previous_subtitle.end = subtitle.end # lengthen previous subtitle
                continue

            current_lines = subtitle.text.split("\n")
            last_lines = previous_subtitle.text.split("\n")

            singleword=False

            if current_lines[0] == last_lines[-1]: # if first current is  last previous
                if len(last_lines)==1:
                    if  len(last_lines[0].split(" "))<2 and len(last_lines[0])>2: # if  is just one word            
                        singleword=True
                        subtitle.text= current_lines[0]+" "+"\n".join(current_lines[1:]) # remove line break after single word
      
                    else:
                        subtitle.text = "\n".join(current_lines[1:]) # discard first line of current            
                else:        
                    subtitle.text = "\n".join(current_lines[1:]) # discard first line of current
            else: # not fusing two lines
                if len(subtitle.text.split(" "))<=2: # only one word in subtitle
             
                    previous_subtitle.end = subtitle.end # lengthen previous subtitle
                    title_text=subtitle.text
                    if title_text[0]!=" ":
                        title_text=" "+title_text

                    previous_subtitle.text+=title_text # add text to previous
                    continue # drop this subtitle


            if self._ts_to_secs(subtitle.start_time) <= self._ts_to_secs(previous_subtitle.end_time): # remove overlap and let 1ms gap
                new_time = max(self._ts_to_secs(subtitle.start_time) - 0.001, 0)
                previous_subtitle.end = self._seconds_to_timestamp(new_time)
            if self._ts_to_secs(subtitle.start_time) >= self._ts_to_secs(subtitle.end_time): # swap start and end if wrong order
                subtitle.start, subtitle.end = subtitle.end, subtitle.start
                

            if not singleword:
                yield previous_subtitle
            previous_subtitle = subtitle
        yield previous_subtitle


    def parse_captions(self, ext: str, content: str) -> List[Dict]:
        """
        Parse WebVTT captions into timestamped segments, annotating
        natural pauses so you can reconstruct paragraphs or lines.

        Args:
            ext: Must be 'vtt'
            content: raw VTT text

        Returns:
            [
              {
                "start": "00:00:01.234",
                "end":   "00:00:03.210",
                "start_sec": 1.234,
                "end_sec":   3.210,
                "separator": "\n\n",   # or "\n" or " "
                "text":      "Hello world"
              },
              ...
            ]
        Raises:
            ValueError if ext != 'vtt'
        """
        if ext != 'vtt':
            raise ValueError(f"Unsupported caption format: {ext}")

        # parse + dedupe exactly as before
        raw_captions = webvtt.from_string(content)
        captions = list(self.dedupe_yt_captions(raw_captions))

        segments: List[Dict] = []
        for idx, cap in enumerate(captions):
            # clean text
            text = cap.text.replace('\n', ' ').strip()
            start_ts = cap.start
            end_ts   = cap.end
            start_sec = self._timestamp_to_seconds(start_ts)
            end_sec   = self._timestamp_to_seconds(end_ts)

            # figure out how big the pause was
            if idx == 0:
                sep = ""
            else:
                prev_end = segments[-1]['end_sec']
                gap = start_sec - prev_end
                if gap > 3:
                    sep = "\n\n"
                elif gap > 1:
                    sep = "\n"
                else:
                    sep = " "

            segments.append({
                "start":     start_ts,
                "end":       end_ts,
                "start_sec": start_sec,
                "end_sec":   end_sec,
                "separator": sep,
                "text":      re.sub(r' +', ' ', text),
            })

        return segments

    def extract_video_info(self, url: str) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Extract video description and captions from a YouTube URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Tuple containing:
            - Dictionary with video information (title, description)
            - String containing the captions/subtitles
        """

        video_id = yt_dlp.extractor.youtube.YoutubeIE.extract_id(url)

        cache_file = os.path.join(CACHE_DIR, video_id + '.json.gz')
        if os.path.isfile(cache_file):
            # print(f'Reusing cached file: {cache_file}')
            return json.load(gzip.open(cache_file, 'rt'))

        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                # Get video info
                video_info = ydl.extract_info(f'https://youtube.com/watch?v={video_id}', download=False)
                video_id = video_info['id']
        except YoutubeDLError as e:
            print(f"Error extracting video information: {str(e)}")
            return None, None
        
        with gzip.open(cache_file, 'wt') as f:
            json.dump(video_info, f, indent=4)

        return video_info

def convert_caption_data(data):
    # Extracting the relevant values from input
    start_sec = data["start_sec"]
    end_sec = data["end_sec"]

    # Calculating offset in milliseconds
    offset = int(start_sec * 1000)

    # Formatting offsetText as mm:ss
    offset_text = str(timedelta(seconds=int(start_sec)))

    # Calculating duration in milliseconds
    duration = int((end_sec - start_sec) * 1000)

    # Returning the transformed dictionary
    return {
        "text": data["text"],
        "offset": offset,
        "offsetText": offset_text,
        "duration": duration
    }

def main():
    parser = argparse.ArgumentParser(description='Extract YouTube video information')
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--output', '-o', help='Output file path (optional)')
    parser.add_argument('--proxy', '-x', help='Proxy URL (optional)')
    args = parser.parse_args()

    extractor = VideoExtractor(proxy=args.proxy)

    # Download metadata
    video_info = extractor.extract_video_info(args.url)
    if not video_info:
        raise ValueError("failed to download video info")

    video_id = video_info['id']

    # Get captions
    caption_track = extractor.get_captions_by_priority(video_info)
    ext = caption_track['ext']
    # print(f'Using captions track: {caption_track['name']} ({ext})')
    
    # Download captions
    downloaded_content = extractor.download_captions(video_id, caption_track)
    
    # Download and parse captions
    caption_text = extractor.parse_captions(ext, downloaded_content)

    # Convert caption data to desired format
    converted_caption_data = [convert_caption_data(data) for data in caption_text]

    output = {
        "title": video_info.get("title", ""),
        "channel": video_info.get("channel", ""),
        "transcript": converted_caption_data,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))

    # print(caption_text)
    # for segment in caption_text:
    #     print(f"{segment['start']} --> {segment['end']}: {segment['text']}")

if __name__ == "__main__":
    main()
