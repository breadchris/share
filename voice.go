package main

//
//import (
//	"encoding/json"
//	"fmt"
//	"github.com/pion/webrtc/v2"
//	"log"
//	"os"
//	"time"
//
//	"bytes"
//	"errors"
//	"github.com/gorilla/mux"
//	"github.com/gorilla/websocket"
//	"github.com/pion/rtp"
//	"io"
//	"math/rand"
//	"net/http"
//	"strconv"
//	"strings"
//	"sync"
//)
//
//var (
//	// only support unified plan
//	cfg = webrtc.Configuration{
//		SDPSemantics: webrtc.SDPSemanticsUnifiedPlanWithFallback,
//	}
//
//	setting webrtc.SettingEngine
//
//	errChanClosed    = errors.New("channel closed")
//	errInvalidTrack  = errors.New("track is nil")
//	errInvalidPacket = errors.New("packet is nil")
//	// errInvalidPC      = errors.New("pc is nil")
//	// errInvalidOptions = errors.New("invalid options")
//	errNotImplemented = errors.New("not implemented")
//)
//
//const (
//	// Time allowed to write a message to the peer.
//	writeWait = 10 * time.Second
//	// Time allowed to read the next pong message from the peer.
//	pongWait = 60 * time.Second
//	// Send pings to peer with this period. Must be less than pongWait.
//	pingPeriod = (pongWait * 9) / 10
//	// Maximum message size allowed from peer.
//	webMaxMessageSize = 51200
//)
//
//var (
//	newline = []byte{'\n'}
//	space   = []byte{' '}
//)
//
//var webUpgrader = websocket.Upgrader{
//	ReadBufferSize:  1024,
//	WriteBufferSize: 1024,
//	CheckOrigin: func(r *http.Request) bool {
//		return true
//	},
//}
//
//// WebWebUser is a middleman between the websocket connection and the hub.
//type WebUser struct {
//	ID            string
//	room          *Room
//	conn          *websocket.Conn          // The websocket connection.
//	send          chan []byte              // Buffered channel of outbound messages.
//	pc            *webrtc.PeerConnection   // WebRTC Peer Connection
//	inTracks      map[uint32]*webrtc.Track // Microphone
//	inTracksLock  sync.RWMutex
//	outTracks     map[uint32]*webrtc.Track // Rest of the room's tracks
//	outTracksLock sync.RWMutex
//
//	rtpCh chan *rtp.Packet
//
//	stop bool
//
//	info WebUserInfo
//}
//
//// WebUserInfo contains some WebUser data
//type WebUserInfo struct {
//	Emoji string `json:"emoji"` // emoji-face like on clients (for test)
//	Mute  bool   `json:"mute"`
//}
//
//// WebUserWrap represents WebUser object sent to client
//type WebUserWrap struct {
//	ID string `json:"id"`
//	WebUserInfo
//}
//
//// Wrap wraps WebUser
//func (u *WebUser) Wrap() *WebUserWrap {
//	return &WebUserWrap{
//		ID:          u.ID,
//		WebUserInfo: u.info,
//	}
//}
//
//// readPump pumps messages from the websocket connection to the hub.
//func (u *WebUser) readPump() {
//	defer func() {
//		u.stop = true
//		u.pc.Close()
//		u.room.Leave(u)
//		u.conn.Close()
//	}()
//	u.conn.SetReadLimit(webMaxMessageSize)
//	u.conn.SetReadDeadline(time.Now().Add(pongWait))
//	u.conn.SetPongHandler(func(string) error { u.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
//	for {
//		_, message, err := u.conn.ReadMessage()
//		if err != nil {
//			log.Println(err)
//			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
//				log.Printf("error: %v", err)
//				log.Println(err)
//			}
//			break
//		}
//		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
//		go func() {
//			err := u.HandleEvent(message)
//			if err != nil {
//				log.Println(err)
//				u.SendErr(err)
//			}
//		}()
//	}
//}
//
//// writePump pumps messages from the hub to the websocket connection.
////
//// A goroutine running writePump is started for each connection. The
//// application ensures that there is at most one writer to a connection by
//// executing all writes from this goroutine.
//func (u *WebUser) writePump() {
//	ticker := time.NewTicker(pingPeriod)
//	defer func() {
//		ticker.Stop()
//		u.stop = true
//		u.conn.Close()
//	}()
//	for {
//		select {
//		case message, ok := <-u.send:
//			u.conn.SetWriteDeadline(time.Now().Add(writeWait))
//			if !ok {
//				// The hub closed the channel.
//				u.conn.WriteMessage(websocket.CloseMessage, []byte{})
//				return
//			}
//			w, err := u.conn.NextWriter(websocket.TextMessage)
//			if err != nil {
//				return
//			}
//			w.Write(message)
//			if err := w.Close(); err != nil {
//				return
//			}
//		case <-ticker.C:
//			u.conn.SetWriteDeadline(time.Now().Add(writeWait))
//			if err := u.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
//				return
//			}
//		}
//	}
//}
//
//// Event represents web socket WebUser event
//type WebEvent struct {
//	Type string `json:"type"`
//
//	Offer     *webrtc.SessionDescription `json:"offer,omitempty"`
//	Answer    *webrtc.SessionDescription `json:"answer,omitempty"`
//	Candidate *webrtc.ICECandidateInit   `json:"candidate,omitempty"`
//	WebUser   *WebUserWrap               `json:"WebUser,omitempty"`
//	Room      *RoomWrap                  `json:"room,omitempty"`
//	Desc      string                     `json:"desc,omitempty"`
//}
//
//// SendEvent sends json body to web socket
//func (u *WebUser) SendEvent(event WebEvent) error {
//	json, err := json.Marshal(event)
//	if err != nil {
//		return err
//	}
//	u.send <- json
//	return nil
//}
//
//// SendEventWebUser sends WebUser to client to identify himself
//func (u *WebUser) SendEventWebUser() error {
//	return u.SendEvent(WebEvent{Type: "WebUser", WebUser: u.Wrap()})
//}
//
//// SendEventRoom sends room to client with WebUsers except me
//func (u *WebUser) SendEventRoom() error {
//	return u.SendEvent(WebEvent{Type: "room", Room: u.room.Wrap(u)})
//}
//
//// BroadcastEvent sends json body to everyone in the room except this WebUser
//func (u *WebUser) BroadcastEvent(event WebEvent) error {
//	json, err := json.Marshal(event)
//	if err != nil {
//		return err
//	}
//	u.room.Broadcast(json, u)
//	return nil
//}
//
//// BroadcastEventJoin sends WebUser_join event
//func (u *WebUser) BroadcastEventJoin() error {
//	return u.BroadcastEvent(WebEvent{Type: "WebUser_join", WebUser: u.Wrap()})
//}
//
//// BroadcastEventLeave sends WebUser_leave event
//func (u *WebUser) BroadcastEventLeave() error {
//	return u.BroadcastEvent(WebEvent{Type: "WebUser_leave", WebUser: u.Wrap()})
//}
//
//// BroadcastEventMute sends microphone mute event to everyone
//func (u *WebUser) BroadcastEventMute() error {
//	return u.BroadcastEvent(WebEvent{Type: "mute", WebUser: u.Wrap()})
//}
//
//// BroadcastEventUnmute sends microphone unmute event to everyone
//func (u *WebUser) BroadcastEventUnmute() error {
//	return u.BroadcastEvent(WebEvent{Type: "unmute", WebUser: u.Wrap()})
//}
//
//// SendErr sends error in json format to web socket
//func (u *WebUser) SendErr(err error) error {
//	return u.SendEvent(WebEvent{Type: "error", Desc: fmt.Sprint(err)})
//}
//
//func (u *WebUser) log(msg ...interface{}) {
//	log.Println(
//		fmt.Sprintf("WebUser %s:", u.ID),
//		fmt.Sprint(msg...),
//	)
//}
//
//// HandleEvent handles WebUser event
//func (u *WebUser) HandleEvent(eventRaw []byte) error {
//	var event *WebEvent
//	err := json.Unmarshal(eventRaw, &event)
//	if err != nil {
//		return err
//	}
//	u.log("handle event", event.Type)
//	if event.Type == "offer" {
//		if event.Offer == nil {
//			return u.SendErr(errors.New("empty offer"))
//		}
//		err := u.HandleOffer(*event.Offer)
//		if err != nil {
//			return err
//		}
//		return nil
//	} else if event.Type == "answer" {
//		if event.Answer == nil {
//			return u.SendErr(errors.New("empty answer"))
//		}
//		u.pc.SetRemoteDescription(*event.Answer)
//		return nil
//	} else if event.Type == "candidate" {
//		if event.Candidate == nil {
//			return u.SendErr(errors.New("empty candidate"))
//		}
//		u.log("adding candidate")
//		u.pc.AddICECandidate(*event.Candidate)
//		return nil
//	} else if event.Type == "mute" {
//		u.info.Mute = true
//		u.BroadcastEventMute()
//		return nil
//	} else if event.Type == "unmute" {
//		u.info.Mute = false
//		u.BroadcastEventUnmute()
//		return nil
//	}
//
//	return u.SendErr(errNotImplemented)
//}
//
//// GetRoomTracks returns list of room incoming tracks
//func (u *WebUser) GetRoomTracks() []*webrtc.Track {
//	tracks := []*webrtc.Track{}
//	for _, WebUser := range u.room.GetWebUsers() {
//		for _, track := range WebUser.inTracks {
//			tracks = append(tracks, track)
//		}
//	}
//	return tracks
//}
//
//func (u *WebUser) supportOpus(offer webrtc.SessionDescription) bool {
//	mediaEngine := webrtc.MediaEngine{}
//	mediaEngine.PopulateFromSDP(offer)
//	var payloadType uint8
//	// Search for Payload type. If the offer doesn't support codec exit since
//	// since they won't be able to decode anything we send them
//	for _, audioCodec := range mediaEngine.GetCodecsByKind(webrtc.RTPCodecTypeAudio) {
//		if audioCodec.Name == "OPUS" {
//			payloadType = audioCodec.PayloadType
//			break
//		}
//	}
//	if payloadType == 0 {
//		return false
//	}
//	return true
//}
//
//// HandleOffer handles webrtc offer
//func (u *WebUser) HandleOffer(offer webrtc.SessionDescription) error {
//	if ok := u.supportOpus(offer); !ok {
//		return errors.New("remote peer does not support opus codec")
//	}
//
//	if len(u.pc.GetTransceivers()) == 0 {
//		// add receive only transciever to get WebUser microphone audio
//		_, err := u.pc.AddTransceiver(webrtc.RTPCodecTypeAudio, webrtc.RtpTransceiverInit{
//			Direction: webrtc.RTPTransceiverDirectionRecvonly,
//		})
//		if err != nil {
//			return err
//		}
//	}
//
//	// Set the remote SessionDescription
//	if err := u.pc.SetRemoteDescription(offer); err != nil {
//		return err
//	}
//
//	err := u.SendAnswer()
//	if err != nil {
//		return err
//	}
//
//	return nil
//}
//
//// Offer return a offer
//func (u *WebUser) Offer() (webrtc.SessionDescription, error) {
//	offer, err := u.pc.CreateOffer(nil)
//	if err != nil {
//		return webrtc.SessionDescription{}, err
//	}
//	err = u.pc.SetLocalDescription(offer)
//	if err != nil {
//		return webrtc.SessionDescription{}, err
//	}
//	return offer, nil
//}
//
//// SendOffer creates webrtc offer
//func (u *WebUser) SendOffer() error {
//	offer, err := u.Offer()
//	err = u.SendEvent(WebEvent{Type: "offer", Offer: &offer})
//	if err != nil {
//		panic(err)
//	}
//	return nil
//}
//
//// SendCandidate sends ice candidate to peer
//func (u *WebUser) SendCandidate(iceCandidate *webrtc.ICECandidate) error {
//	if iceCandidate == nil {
//		return errors.New("nil ice candidate")
//	}
//	iceCandidateInit := iceCandidate.ToJSON()
//	err := u.SendEvent(WebEvent{Type: "candidate", Candidate: &iceCandidateInit})
//	if err != nil {
//		return err
//	}
//	return nil
//}
//
//// Answer creates webrtc answer
//func (u *WebUser) Answer() (webrtc.SessionDescription, error) {
//	answer, err := u.pc.CreateAnswer(nil)
//	if err != nil {
//		return webrtc.SessionDescription{}, err
//	}
//	// Sets the LocalDescription, and starts our UDP listeners
//	if err = u.pc.SetLocalDescription(answer); err != nil {
//		return webrtc.SessionDescription{}, err
//	}
//	return answer, nil
//}
//
//// SendAnswer creates answer and send it via websocket
//func (u *WebUser) SendAnswer() error {
//	answer, err := u.Answer()
//	if err != nil {
//		return err
//	}
//	err = u.SendEvent(WebEvent{Type: "answer", Answer: &answer})
//	return nil
//}
//
//// receiveInTrackRTP receive all incoming tracks' rtp and sent to one channel
//func (u *WebUser) receiveInTrackRTP(remoteTrack *webrtc.Track) {
//	for {
//		if u.stop {
//			return
//		}
//		rtp, err := remoteTrack.ReadRTP()
//		if err != nil {
//			if err == io.EOF {
//				return
//			}
//			log.Fatalf("rtp err => %v", err)
//		}
//		u.rtpCh <- rtp
//	}
//}
//
//// ReadRTP read rtp packet
//func (u *WebUser) ReadRTP() (*rtp.Packet, error) {
//	rtp, ok := <-u.rtpCh
//	if !ok {
//		return nil, errChanClosed
//	}
//	return rtp, nil
//}
//
//// WriteRTP send rtp packet to WebUser outgoing tracks
//func (u *WebUser) WriteRTP(pkt *rtp.Packet) error {
//	if pkt == nil {
//		return errInvalidPacket
//	}
//	u.outTracksLock.RLock()
//	track := u.outTracks[pkt.SSRC]
//	u.outTracksLock.RUnlock()
//
//	if track == nil {
//		log.Printf("WebRTCTransport.WriteRTP track==nil pkt.SSRC=%d", pkt.SSRC)
//		return errInvalidTrack
//	}
//
//	// log.Debugf("WebRTCTransport.WriteRTP pkt=%v", pkt)
//	err := track.WriteRTP(pkt)
//	if err != nil {
//		// log.Errorf(err.Error())
//		// u.writeErrCnt++
//		return err
//	}
//	return nil
//}
//
//func (u *WebUser) broadcastIncomingRTP() {
//	for {
//		rtp, err := u.ReadRTP()
//		if err != nil {
//			panic(err)
//		}
//		for _, WebUser := range u.room.GetOtherWebUsers(u) {
//			err := WebUser.WriteRTP(rtp)
//			if err != nil {
//				// panic(err)
//				fmt.Println(err)
//			}
//		}
//	}
//}
//
//// GetInTracks return incoming tracks
//func (u *WebUser) GetInTracks() map[uint32]*webrtc.Track {
//	u.inTracksLock.RLock()
//	defer u.inTracksLock.RUnlock()
//	return u.inTracks
//
//}
//
//// GetOutTracks return outgoing tracks
//func (u *WebUser) GetOutTracks() map[uint32]*webrtc.Track {
//	u.outTracksLock.RLock()
//	defer u.outTracksLock.RUnlock()
//	return u.outTracks
//}
//
//// AddTrack adds track to peer connection
//func (u *WebUser) AddTrack(ssrc uint32) error {
//	track, err := u.pc.NewTrack(webrtc.DefaultPayloadTypeOpus, ssrc, string(ssrc), string(ssrc))
//	if err != nil {
//		return err
//	}
//	if _, err := u.pc.AddTrack(track); err != nil {
//		log.Println("ERROR Add remote track as peerConnection local track", err)
//		return err
//	}
//
//	u.outTracksLock.Lock()
//	u.outTracks[track.SSRC()] = track
//	u.outTracksLock.Unlock()
//	return nil
//}
//
//// Watch for debug
//func (u *WebUser) Watch() {
//	ticker := time.NewTicker(time.Second * 5)
//	for range ticker.C {
//		if u.stop {
//			ticker.Stop()
//			return
//		}
//		fmt.Println("ID:", u.ID, "out: ", u.GetOutTracks())
//	}
//}
//
//// serveWs handles websocket requests from the peer.
//func serveWs(rooms *Rooms, w http.ResponseWriter, r *http.Request) {
//	conn, err := webUpgrader.Upgrade(w, r, nil)
//	if err != nil {
//		log.Println(err)
//		return
//	}
//
//	mediaEngine := webrtc.MediaEngine{}
//	mediaEngine.RegisterCodec(webrtc.NewRTPOpusCodec(webrtc.DefaultPayloadTypeOpus, 48000))
//
//	api := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine))
//	peerConnection, err := api.NewPeerConnection(peerConnectionConfig)
//
//	roomID := strings.ReplaceAll(r.URL.Path, "/", "")
//	room := rooms.GetOrCreate(roomID)
//
//	log.Println("ws connection to room:", roomID, len(room.GetWebUsers()), "WebUsers")
//
//	emojis := []string{
//		"😎", "🧐", "🤡", "👻", "😷", "🤗", "😏",
//		"👽", "👨‍🚀", "🐺", "🐯", "🦁", "🐶", "🐼", "🙈",
//	}
//
//	WebUser := &WebUser{
//		ID:        strconv.FormatInt(time.Now().UnixNano(), 10), // generate random id based on timestamp
//		room:      room,
//		conn:      conn,
//		send:      make(chan []byte, 256),
//		pc:        peerConnection,
//		inTracks:  make(map[uint32]*webrtc.Track),
//		outTracks: make(map[uint32]*webrtc.Track),
//		rtpCh:     make(chan *rtp.Packet, 100),
//
//		info: WebUserInfo{
//			Emoji: emojis[rand.Intn(len(emojis))],
//			Mute:  true, // WebUser is muted by default
//		},
//	}
//
//	WebUser.pc.OnICECandidate(func(iceCandidate *webrtc.ICECandidate) {
//		if iceCandidate != nil {
//			err := WebUser.SendCandidate(iceCandidate)
//			if err != nil {
//				log.Println("fail send candidate", err)
//			}
//		}
//	})
//
//	WebUser.pc.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
//		log.Printf("Connection State has changed %s \n", connectionState.String())
//		if connectionState == webrtc.ICEConnectionStateConnected {
//			log.Println("WebUser joined")
//			tracks := WebUser.GetRoomTracks()
//			fmt.Println("attach ", len(tracks), "tracks to new WebUser")
//			WebUser.log("new WebUser add tracks", len(tracks))
//			for _, track := range tracks {
//				err := WebUser.AddTrack(track.SSRC())
//				if err != nil {
//					log.Println("ERROR Add remote track as peerConnection local track", err)
//					panic(err)
//				}
//			}
//			err = WebUser.SendOffer()
//			if err != nil {
//				panic(err)
//			}
//		} else if connectionState == webrtc.ICEConnectionStateDisconnected ||
//			connectionState == webrtc.ICEConnectionStateFailed ||
//			connectionState == webrtc.ICEConnectionStateClosed {
//
//			WebUser.stop = true
//			senders := WebUser.pc.GetSenders()
//			for _, roomWebUser := range WebUser.room.GetOtherWebUsers(WebUser) {
//				WebUser.log("removing tracks from WebUser")
//				for _, sender := range senders {
//					ssrc := sender.Track().SSRC()
//
//					roomWebUserSenders := roomWebUser.pc.GetSenders()
//					for _, roomWebUserSender := range roomWebUserSenders {
//						if roomWebUserSender.Track().SSRC() == ssrc {
//							err := roomWebUser.pc.RemoveTrack(roomWebUserSender)
//							if err != nil {
//								panic(err)
//							}
//						}
//					}
//				}
//			}
//
//		}
//	})
//
//	WebUser.pc.OnTrack(func(remoteTrack *webrtc.Track, receiver *webrtc.RTPReceiver) {
//		WebUser.log(
//			"peerConnection.OnTrack",
//			fmt.Sprintf("track has started, of type %d: %s, ssrc: %d \n", remoteTrack.PayloadType(), remoteTrack.Codec().Name, remoteTrack.SSRC()),
//		)
//		if _, alreadyAdded := WebUser.inTracks[remoteTrack.SSRC()]; alreadyAdded {
//			WebUser.log("WebUser.inTrack != nil", "already handled")
//			return
//		}
//
//		WebUser.inTracks[remoteTrack.SSRC()] = remoteTrack
//		for _, roomWebUser := range WebUser.room.GetOtherWebUsers(WebUser) {
//			log.Println("add remote track", fmt.Sprintf("(WebUser: %s)", WebUser.ID), "track to WebUser ", roomWebUser.ID)
//			if err := roomWebUser.AddTrack(remoteTrack.SSRC()); err != nil {
//				log.Println(err)
//				continue
//			}
//			err := roomWebUser.SendOffer()
//			if err != nil {
//				panic(err)
//			}
//		}
//		go WebUser.receiveInTrackRTP(remoteTrack)
//		go WebUser.broadcastIncomingRTP()
//	})
//
//	WebUser.room.Join(WebUser)
//
//	// Allow collection of memory referenced by the caller by doing all work in
//	// new goroutines.
//	go WebUser.writePump()
//	go WebUser.readPump()
//	go WebUser.Watch()
//
//	WebUser.SendEventWebUser()
//	WebUser.SendEventRoom()
//}
//
//// Prepare the configuration
//var peerConnectionConfig = webrtc.Configuration{
//	ICEServers: []webrtc.ICEServer{
//		{
//			URLs: []string{"stun:stun.l.google.com:19302"},
//		},
//	},
//}
//
//func setupVoice() {
//	rooms := NewRooms()
//	router := mux.NewRouter()
//
//	router.HandleFunc("/api/stats", func(w http.ResponseWriter, r *http.Request) {
//		bytes, err := json.Marshal(rooms.GetStats())
//		if err != nil {
//			http.Error(w, fmt.Sprint(err), 500)
//		}
//		w.Write(bytes)
//	}).Methods("GET")
//	router.HandleFunc("/api/rooms/{id}", func(w http.ResponseWriter, r *http.Request) {
//		w.Header().Add("Access-Control-Allow-Headers", "*")
//		w.Header().Add("Access-Control-Allow-Origin", "*")
//		vars := mux.Vars(r)
//		roomID := vars["id"]
//		room, err := rooms.Get(roomID)
//		if err == errNotFound {
//			http.NotFound(w, r)
//			return
//		}
//		bytes, err := json.Marshal(room.Wrap(nil))
//		if err != nil {
//			http.Error(w, fmt.Sprint(err), 500)
//		}
//		w.Write(bytes)
//	}).Methods("GET")
//
//	router.HandleFunc("/{id}", func(w http.ResponseWriter, r *http.Request) {
//		serveWs(rooms, w, r)
//	})
//
//	// go rooms.Watch()
//	port := os.Getenv("PORT")
//	if port == "" {
//		port = "80"
//		log.Printf("Defaulting to port %s", port)
//	}
//	addr := fmt.Sprintf(":%s", port)
//	fmt.Printf("listening on %s\n", addr)
//
//	srv := &http.Server{
//		Handler:      router,
//		Addr:         addr,
//		WriteTimeout: 15 * time.Second,
//		ReadTimeout:  15 * time.Second,
//	}
//
//	log.Fatal(srv.ListenAndServe())
//}
//
//type broadcastMsg struct {
//	data    []byte
//	WebUser *WebUser // message will be broadcasted to everyone, except this WebUser
//}
//
//// Room maintains the set of active clients and broadcasts messages to the
//// clients.
//type Room struct {
//	Name      string
//	WebUsers  map[string]*WebUser
//	broadcast chan broadcastMsg
//	join      chan *WebUser // Register requests from the clients.
//	leave     chan *WebUser // Unregister requests from clients.
//}
//
//// RoomWrap is a public representation of a room
//type RoomWrap struct {
//	WebUsers []*WebUserWrap `json:"WebUsers"`
//	Name     string         `json:"name"`
//	Online   int            `json:"online"`
//}
//
//// Wrap returns public version of room
//func (r *Room) Wrap(me *WebUser) *RoomWrap {
//	WebUsersWrap := []*WebUserWrap{}
//	for _, WebUser := range r.GetWebUsers() {
//		if me != nil {
//			// do not add current WebUser to room
//			if me.ID == WebUser.ID {
//				continue
//			}
//		}
//		WebUsersWrap = append(WebUsersWrap, WebUser.Wrap())
//	}
//
//	return &RoomWrap{
//		WebUsers: WebUsersWrap,
//		Name:     r.Name,
//		Online:   len(WebUsersWrap),
//	}
//}
//
//// NewRoom creates new room
//func NewRoom(name string) *Room {
//	return &Room{
//		broadcast: make(chan broadcastMsg),
//		join:      make(chan *WebUser),
//		leave:     make(chan *WebUser),
//		WebUsers:  make(map[string]*WebUser),
//		Name:      name,
//	}
//}
//
//// GetWebUsers converts map[int64]*WebUser to list
//func (r *Room) GetWebUsers() []*WebUser {
//	WebUsers := []*WebUser{}
//	for _, WebUser := range r.WebUsers {
//		WebUsers = append(WebUsers, WebUser)
//	}
//	return WebUsers
//}
//
//// GetOtherWebUsers returns other WebUsers of room except current
//func (r *Room) GetOtherWebUsers(wu *WebUser) []*WebUser {
//	WebUsers := []*WebUser{}
//	for _, WebUserCandidate := range r.WebUsers {
//		if wu.ID == WebUserCandidate.ID {
//			continue
//		}
//		WebUsers = append(WebUsers, WebUserCandidate)
//	}
//	return WebUsers
//}
//
//// Join connects WebUser and room
//func (r *Room) Join(WebUser *WebUser) {
//	r.join <- WebUser
//}
//
//// Leave disconnects WebUser and room
//func (r *Room) Leave(WebUser *WebUser) {
//	r.leave <- WebUser
//}
//
//// Broadcast sends message to everyone except WebUser (if passed)
//func (r *Room) Broadcast(data []byte, WebUser *WebUser) {
//	message := broadcastMsg{data: data, WebUser: WebUser}
//	r.broadcast <- message
//}
//
//// GetWebUsersCount return WebUsers count in the room
//func (r *Room) GetWebUsersCount() int {
//	return len(r.GetWebUsers())
//}
//
//func (r *Room) run() {
//	for {
//		select {
//		case wu := <-r.join:
//			r.WebUsers[wu.ID] = wu
//			go wu.BroadcastEventJoin()
//		case wu := <-r.leave:
//			if _, ok := r.WebUsers[wu.ID]; ok {
//				delete(r.WebUsers, wu.ID)
//				close(wu.send)
//			}
//			go wu.BroadcastEventLeave()
//		case message := <-r.broadcast:
//			for _, wu := range r.WebUsers {
//				// message will be broadcasted to everyone, except this WebUser
//				if message.WebUser != nil && wu.ID == message.WebUser.ID {
//					continue
//				}
//				select {
//				case wu.send <- message.data:
//				default:
//					close(wu.send)
//					delete(r.WebUsers, wu.ID)
//				}
//			}
//		}
//	}
//}
//
//// Rooms is a set of rooms
//type Rooms struct {
//	rooms map[string]*Room
//}
//
//var errNotFound = errors.New("not found")
//
//// Get room by room id
//func (r *Rooms) Get(roomID string) (*Room, error) {
//	if room, exists := r.rooms[roomID]; exists {
//		return room, nil
//	}
//	return nil, errNotFound
//}
//
//// GetOrCreate creates room if it does not exist
//func (r *Rooms) GetOrCreate(roomID string) *Room {
//	room, err := r.Get(roomID)
//	if err == nil {
//		return room
//	}
//	newRoom := NewRoom(roomID)
//	r.AddRoom(roomID, newRoom)
//	go newRoom.run()
//	return newRoom
//
//}
//
//// AddRoom adds room to rooms list
//func (r *Rooms) AddRoom(roomID string, room *Room) error {
//	if _, exists := r.rooms[roomID]; exists {
//		return errors.New("room with id " + roomID + " already exists")
//	}
//	r.rooms[roomID] = room
//	return nil
//}
//
//// RemoveRoom remove room from rooms list
//func (r *Rooms) RemoveRoom(roomID string) error {
//	if _, exists := r.rooms[roomID]; exists {
//		delete(r.rooms, roomID)
//		return nil
//	}
//	return nil
//}
//
//// RoomsStats is an app global statistics
//type RoomsStats struct {
//	Online int         `json:"online"`
//	Rooms  []*RoomWrap `json:"rooms"`
//}
//
//// GetStats get app statistics
//func (r *Rooms) GetStats() RoomsStats {
//	stats := RoomsStats{
//		Rooms: []*RoomWrap{},
//	}
//	for _, room := range r.rooms {
//		stats.Online += room.GetWebUsersCount()
//		stats.Rooms = append(stats.Rooms, room.Wrap(nil))
//	}
//	return stats
//}
//
//// NewRooms creates rooms instance
//func NewRooms() *Rooms {
//	return &Rooms{
//		rooms: make(map[string]*Room, 100),
//	}
//}
