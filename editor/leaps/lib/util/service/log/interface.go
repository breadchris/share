package log

/*--------------------------------------------------------------------------------------------------
 */

// Modular - A log printer that allows you to branch new modules.
type Modular interface {
	NewModule(prefix string) Modular

	Fatalf(message string, other ...interface{})
	Errorf(message string, other ...interface{})
	Warnf(message string, other ...interface{})
	Infof(message string, other ...interface{})
	Debugf(message string, other ...interface{})
	Tracef(message string, other ...interface{})

	Fatalln(message string)
	Errorln(message string)
	Warnln(message string)
	Infoln(message string)
	Debugln(message string)
	Traceln(message string)

	Output(calldepth int, s string) error
}

/*--------------------------------------------------------------------------------------------------
 */
