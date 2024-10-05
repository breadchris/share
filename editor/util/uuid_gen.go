/*
Package util - Various miscellaneous utilities used throughout leaps lib.
*/
package util

import (
	"fmt"
	"log"
	"time"

	"github.com/gofrs/uuid"
)

/*--------------------------------------------------------------------------------------------------
 */

/*
GenerateStampedUUID - Generates a UUID and prepends a timestamp to it.
*/
func GenerateStampedUUID() string {
	tstamp := time.Now().Unix()

	return fmt.Sprintf("%v%v", tstamp, GenerateUUID())
}

/*
GenerateUUID - Generates a UUID and returns it as a hex encoded string.
*/
// TODO: handle the error more gracefully
func GenerateUUID() string {
	u, err := uuid.NewV4()
	if err != nil {
		log.Fatal(err)
	}
	return u.String()
}

/*--------------------------------------------------------------------------------------------------
 */
