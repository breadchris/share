package chalgen

import (
	"encoding/json"
	"fmt"
)

type GraphNode struct {
	ID         string
	X          int32
	Y          int32
	Name       string
	Flag       string
	Entrypoint bool
	Challenge  *Challenge
}

func (s *Challenge) UnmarshalJSON(b []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}

	var t string
	if err := json.Unmarshal(raw["type"], &t); err != nil {
		return err
	}

	switch t {
	case "imagemap":
		var c ImageMap
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "cms":
		var c CMS
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "base64":
		var c Base64
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "twitter":
		var c Twitter
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "caesar_cipher":
		var c CaesarCipher
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "pcap":
		var c PCAP
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "exif":
		var c Exif
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "slack":
		var c Slack
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "phone":
		var c Phone
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "file_manager":
		var c FileManager
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "maze":
		var c Maze
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "xor":
		var c Xor
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	}
	return nil
}

func (s *Challenge) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"type":  s.Type,
		"value": s.Value,
	})
}

type Challenge struct {
	Type  string
	Value ChallengeType
}

type Edge struct {
	From string
	To   string
}

type Graph struct {
	Nodes []GraphNode
	Edges []Edge
}

type ChallengeType interface {
	isChallengeType()
}

type ImageConfig struct {
	URL    string
	Shape  string
	Coords []int32
}

type (
	ImageMap struct {
		EntryImage   string
		ImageConfigs []ImageConfig
	}
	CMS struct {
		Items []CMSItem
	}
	Base64 struct {
		Data string
	}
	Twitter struct {
		Users    []User
		Posts    []EvidencePost
		Comments []Comment
	}
	CaesarCipher struct {
		Plaintext string
		Shift     int32
	}
	PCAP struct {
		Packets []Packet
	}
	Exif struct {
		Key   string
		Value string
	}
	Slack struct {
		Users    []User
		Channels []Channel
	}
	Phone struct {
		Apps []PhoneApp
		Name string
	}
	FileManager struct {
		URLs     []string
		Password string
	}
	Maze struct {
		Rows    uint32
		Columns uint32
		Paths   []MazePath
	}
	Xor struct {
		Plaintext string
		Key       string
	}
	Zip struct {
		Files    []EvidenceFile
		Password string
	}
	Pdf struct {
		Content string
	}
	Search struct {
		Entry    []string
		Password string
	}
	PassShare struct {
		Password  string
		Solutions []Solution
		Message   string
	}
	Hashes struct {
		Seed      string
		Format    string
		Count     int32
		Overrides []Override
		Length    int32
	}
	AudioPlayer struct {
		Songs []Song
	}
	Data struct {
		Data string
	}
)

// Implement the interface for all ChallengeType structs
func (*ImageMap) isChallengeType()     {}
func (*CMS) isChallengeType()          {}
func (*Base64) isChallengeType()       {}
func (*Twitter) isChallengeType()      {}
func (*CaesarCipher) isChallengeType() {}
func (*PCAP) isChallengeType()         {}
func (*Exif) isChallengeType()         {}
func (*Slack) isChallengeType()        {}
func (*Phone) isChallengeType()        {}
func (*FileManager) isChallengeType()  {}
func (*Maze) isChallengeType()         {}
func (*Xor) isChallengeType()          {}
func (*Zip) isChallengeType()          {}
func (*Pdf) isChallengeType()          {}
func (*Search) isChallengeType()       {}
func (*PassShare) isChallengeType()    {}
func (*Hashes) isChallengeType()       {}
func (*AudioPlayer) isChallengeType()  {}
func (*Data) isChallengeType()         {}

type CMSItem struct {
	Title           string  // Book title
	Content         string  // Book description or summary
	Author          string  // Author name
	PublicationYear int     // Year of publication
	Genre           string  // Genre category
	AvailableCopies int     // Number of available copies
	FeesOwed        float64 // Outstanding fees for a loaned book
	ISBN            string  // ISBN number
	LibrarySection  string  // Library section
	Borrower        string  `description:"The name of the person who has borrowed the book."`
}

type Song struct {
	Name        string
	Artist      string
	Album       string
	URL         string
	CoverArtURL string
}

type Override struct {
	Index int32
	Text  string
}

type Solution struct {
	ID   int32
	Hash string
}

type EvidenceFile struct {
	URL  string
	Text string
}

type MazePath struct {
	Coords []MazeCoordinate
	Result string
}

type MazeCoordinate struct {
	Row uint32
	Col uint32
}

type PhoneApp struct {
	Name string
	URL  string
	HTML string
	App  *App
}

func (s *App) UnmarshalJSON(b []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}

	var t string
	if err := json.Unmarshal(raw["type"], &t); err != nil {
		return err
	}

	switch t {
	case "tracker":
		var c Tracker
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	case "photo_gallery":
		var c PhotoGallery
		if err := json.Unmarshal(raw["value"], &c); err != nil {
			return err
		}
		s.Type = t
		s.Value = &c
	default:
		return fmt.Errorf("unknown app type: %s", t)
	}
	return nil
}

func (s *App) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"type":  s.Type,
		"value": s.Value,
	})
}

type App struct {
	Type  string
	Value AppType
}

type AppType interface {
	isAppType()
}

type (
	Tracker struct {
		Password string
		Events   []Event
	}
	PhotoGallery struct {
		URLs []string
	}
)

func (*Tracker) isAppType()      {}
func (*PhotoGallery) isAppType() {}

type Event struct {
	Timestamp int64
	Name      string
}

type User struct {
	Username string
	Bio      string
	Password string
	Image    string
}

type EvidencePost struct {
	Username string
	Content  string
}

type Comment struct {
	PostNumber int64
	Username   int64
	Content    string
}

type Packet struct {
	Timestamp   int64
	Source      string
	Destination string
	Protocol    string
	Data        string
}

type Channel struct {
	Name      string
	Usernames []string
	Messages  []Message
}

type Message struct {
	Username  string
	Content   string
	Timestamp int64
}
