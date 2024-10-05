package acl

// Anarchy - Most basic implementation of an ACL, everyone has access to everything.
type Anarchy struct {
	AllowCreate bool
}

// NewAnarchy - Create a new anarchy authenticator.
func NewAnarchy(allowCreate bool) Authenticator {
	return Anarchy{AllowCreate: allowCreate}
}

// Authenticate - Always returns at least edit access, because anarchy.
func (a Anarchy) Authenticate(_ interface{}, _, _ string) AccessLevel {
	if !a.AllowCreate {
		return EditAccess
	}
	return CreateAccess
}
