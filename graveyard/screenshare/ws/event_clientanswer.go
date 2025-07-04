package ws

import (
	"fmt"

	"github.com/breadchris/share/screenshare/ws/outgoing"
	"github.com/rs/zerolog/log"
)

func init() {
	register("clientanswer", func() Event {
		return &ClientAnswer{}
	})
}

type ClientAnswer outgoing.P2PMessage

func (e *ClientAnswer) Execute(rooms *Rooms, current ClientInfo) error {
	room, err := rooms.CurrentRoom(current)
	if err != nil {
		return err
	}

	session, ok := room.Sessions[e.SID]

	if !ok {
		log.Debug().Str("id", e.SID.String()).Msg("unknown session")
		return nil
	}

	if session.Client != current.ID {
		return fmt.Errorf("permission denied for session %s", e.SID)
	}

	room.Users[session.Host].Write <- outgoing.ClientAnswer(*e)

	return nil
}
