package xctf

import "testing"

func TestEncryptZip(t *testing.T) {
	err := CreateEncryptedZip("/tmp/test", "password", "/tmp/enc.zip")
	if err != nil {
		t.Error("Test failed")
	}
}
