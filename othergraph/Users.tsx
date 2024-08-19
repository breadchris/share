import React from 'react';
import { Colors, Icon } from '@blueprintjs/core'
import { collaboration } from './collaboration'
import { getInitials, darken } from './util'

type UserTagProps = {
  id: string
  full?: boolean
  edit?: boolean
}

function UserTag(props: UserTagProps) {
  let user = collaboration.useUserById(props.id)
  if (props.id === collaboration.currentUser.id) {
    user = collaboration.currentUser
  }

  if (!user) return null

  const light = user.color
  const dark = darken(light, 0.5)

  return (
    <span
      title={user.name}
      style={{
        borderRadius: '40px',
        border: '1px solid black',
        background: `linear-gradient(to right, ${dark}, ${light})`,
        fontSize: props.full ? 12 : 10,
        padding: props.full ? '0 6px' : '0',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '22px',
        textShadow: '1px 1px 2px #222',
        color: 'white',
        display: 'block',
        width: props.full ? 'auto' : 22,
        height: 22,
      }}
    >
      {props.edit && <Icon icon="edit" size={10} color="white" />}
      {!props.edit && (props.full ? user.name : getInitials(user.name))}
    </span>
  )
}

type UserTagListProps = {
  userIds: string[]
  nodeId: string
}

export function UserTagList(props: UserTagListProps) {
  const editing = collaboration.useEditing(props.nodeId) || []

  return (
    <div
      className="flex"
      style={{
        position: 'relative',
        left: (props.userIds.length - 1) * 6,
      }}
    >
      {props.userIds.reverse().map((id, i) => (
        <div
          key={`${id}-${i}`}
          style={{
            position: 'relative',
            zIndex: 100 - i,
            right: i * 6,
          }}
        >
          <UserTag id={id} edit={editing.includes(id)} />
        </div>
      ))}
    </div>
  )
}

function CurrentUserTag() {
  const { id } = collaboration.currentUser

  return <UserTag id={id} full />
}

export function Users() {
  const users = collaboration.useUserState()

  return (
    <div className="flex">
      {users.map((u, i) => (
        <div key={`${u.id}-${i}`} style={{ marginRight: 5 }}>
          <UserTag id={u.id} />
        </div>
      ))}
      {users.length > 0 && (
        <div
          style={{
            height: 16,
            width: 1,
            background: Colors.DARK_GRAY5,
            marginRight: 10,
            marginLeft: 5,
          }}
        />
      )}
      <CurrentUserTag />
    </div>
  )
}
