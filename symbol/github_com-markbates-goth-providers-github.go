// Code generated by 'yaegi extract github.com/markbates/goth/providers/github'. DO NOT EDIT.

package symbol

import (
	"github.com/markbates/goth/providers/github"
	"reflect"
)

func init() {
	Symbols["github.com/markbates/goth/providers/github/github"] = map[string]reflect.Value{
		// function, constant and variable definitions
		"AuthURL":                         reflect.ValueOf(&github.AuthURL).Elem(),
		"EmailURL":                        reflect.ValueOf(&github.EmailURL).Elem(),
		"ErrNoVerifiedGitHubPrimaryEmail": reflect.ValueOf(&github.ErrNoVerifiedGitHubPrimaryEmail).Elem(),
		"New":                             reflect.ValueOf(github.New),
		"NewCustomisedURL":                reflect.ValueOf(github.NewCustomisedURL),
		"ProfileURL":                      reflect.ValueOf(&github.ProfileURL).Elem(),
		"TokenURL":                        reflect.ValueOf(&github.TokenURL).Elem(),

		// type definitions
		"Provider": reflect.ValueOf((*github.Provider)(nil)),
		"Session":  reflect.ValueOf((*github.Session)(nil)),
	}
}
