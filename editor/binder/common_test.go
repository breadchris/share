package binder

import (
	"github.com/breadchris/share/editor/util/service/log"
	"github.com/breadchris/share/editor/util/service/metrics"
	"os"
)

func loggerAndStats() (log.Modular, metrics.Type) {
	logConf := log.NewLoggerConfig()
	logConf.LogLevel = "OFF"

	logger := log.NewLogger(os.Stdout, logConf)
	stats := metrics.DudType{}

	return logger, stats
}
