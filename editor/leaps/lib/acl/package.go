/*
Package acl - Contains solutions for introducing Access Control Layers to a leaps service. All acl
types should implement the Authenticator interface, as this is used by the curator to determine user
access. ACLs can also implement behaviour for managing sources or exposing information through HTTP
APIs etc.
*/
package acl
