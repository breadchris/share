package main

import (
	"log"
	"reflect"
)

var (
	glo            = getGlobalObject()
	importIdentifier = "__$YJS$__"
)

func init() {
	if glo[importIdentifier].(bool) {
  		logMessage()
	}
	glo[importIdentifier] = true
}

func getGlobalObject() map[string]interface{} {
	if globalThis := tryGetGlobal("globalThis"); globalThis != nil {
		return globalThis
	}
	if window := tryGetGlobal("window"); window != nil {
		return window
	}
	if global := tryGetGlobal("global"); global != nil {
		return global
	}
	return make(map[string]interface{})
}

func tryGetGlobal(name string) map[string]interface{} {
	globalObj := reflect.ValueOf(nil)
	if globalObj.Kind() != reflect.Invalid {
		return globalObj.Interface().(map[string]interface{})
	}
	return nil
}

func logMessage() {
	log.Println("Dear reader of this message. Please take this seriously.")
	log.Println("If you see this message, make sure that you only import one version of Yjs. In many cases,")
	log.Println("your package manager installs two versions of Yjs that are used by different packages within your project.")
	log.Println("Another reason for this message is that some parts of your project use the commonjs version of Yjs")
	log.Println("and others use the EcmaScript version of Yjs.")
	log.Println("This often leads to issues that are hard to debug. We often need to perform constructor checks,")
	log.Println("e.g. `struct instanceof GC`. If you imported different versions of Yjs, it is impossible for us to")
	log.Println("do the constructor checks anymore - which might break the CRDT algorithm.")
	log.Println("https://github.com/yjs/yjs/issues/438")
}

// Example function to mimic 'Doc' as exported from './internals.js'
func Doc() {
	// Implement the function
}

// Other functions can be defined similarly...
