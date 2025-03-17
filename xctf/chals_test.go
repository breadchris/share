package xctf

import (
	"encoding/hex"
	"fmt"
	exifcommon "github.com/dsoprea/go-exif/v2/common"
	"github.com/dsoprea/go-exif/v3"
	jis "github.com/dsoprea/go-jpeg-image-structure/v2"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestXor(t *testing.T) {
	o := xorEncryptDecrypt([]byte("This is a test to see if it works."), []byte("dog"))
	println(hex.EncodeToString(o))
	println(string(xorEncryptDecrypt(o, []byte("dog"))))
}

func TestEncryptZip(t *testing.T) {
	err := CreateEncryptedZip("/tmp/test", "password", "/tmp/enc.zip")
	if err != nil {
		t.Error("Test failed")
	}
}

func TestImage(t *testing.T) {
	// TODO breadchris how do you handle files during tests?
	// where do they go? folder names? outputs? cleanup?
	fi := "/Users/hacked/Downloads/1999 Happy Meal Lego.jpg"

	intfc, _ := jis.NewJpegMediaParser().ParseFile(fi)
	sl := intfc.(*jis.SegmentList)
	ib, _ := sl.ConstructExifBuilder()
	ifd0Ib, _ := exif.GetOrCreateIbFromRootIb(ib, "IFD0")
	ifdIb, _ := exif.GetOrCreateIbFromRootIb(ib, "IFD")

	g := exif.GpsDegrees{
		Degrees: 0,
		Minutes: 0,
		Seconds: 0,
	}
	gi := exif.GpsInfo{
		Latitude:  g,
		Longitude: g,
	}
	_ = ifd0Ib.SetStandardWithName("Artist", "Test")
	_ = ifdIb.SetStandardWithName("DateTimeOriginal", time.Date(2021, time.January, 1, 0, 0, 0, 0, time.UTC))
	err := ib.AddStandard(exifcommon.IfdPathStandardGps.TagId(), gi)
	if err != nil {
		t.Fatal(err)
	}

	_ = sl.SetExif(ib)
	f, _ := os.OpenFile("/tmp/1999 Happy Meal Lego.jpg", os.O_RDWR|os.O_CREATE, 0755)
	defer f.Close()
	_ = sl.Write(f)
}

func createMaze(root string, currentDepth, maxDepth, maxFolders int, wordlist []string) error {
	if currentDepth > maxDepth {
		return nil
	}
	count := rand.Intn(maxFolders) + 1
	for i := 0; i < count; i++ {
		folderName := fmt.Sprintf("%s_%d", wordlist[rand.Intn(len(wordlist))], rand.Intn(10000))
		folderPath := filepath.Join(root, folderName)
		if err := os.Mkdir(folderPath, 0755); err != nil {
			return err
		}
		if currentDepth < maxDepth && rand.Intn(2) == 0 {
			if err := createMaze(folderPath, currentDepth+1, maxDepth, maxFolders, wordlist); err != nil {
				return err
			}
		}
	}
	return nil
}

func CreateMaze(maxDepth, maxFolders int, wordlist []string) error {
	rand.Seed(time.Now().UnixNano())
	root := "data/xctf/maze"
	if err := os.MkdirAll(root, 0755); err != nil && !os.IsExist(err) {
		return err
	}
	return createMaze(root, 1, maxDepth, maxFolders, wordlist)
}

func TestFolderMaze(t *testing.T) {
	wordlist := []string{"alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel"}
	if err := CreateMaze(20, 10, wordlist); err != nil {
		fmt.Println("Error creating maze:", err)
	} else {
		fmt.Println("Maze created successfully!")
	}
}

func TestPcap(t *testing.T) {
	rand.Seed(time.Now().UnixNano())
	chalDir := "./challenge"
	if err := os.MkdirAll(chalDir, 0755); err != nil {
		log.Fatal(err)
	}

	// Example usage: Generate the PCAPLogin challenge.
	if err := PCAPLogin(chalDir, "admin", "password", "output.pcap", "FLAG{example}", "upper"); err != nil {
		log.Fatalf("PCAPLogin challenge failed: %v", err)
	}

	// Example usage: Generate the PingPCAP challenge.
	if err := PingPCAP(chalDir, "extra_data", "FLAG{example}"); err != nil {
		log.Fatalf("PingPCAP challenge failed: %v", err)
	}
}
