FROM cthompson4321/gotty:v0.0.1

{setup}

WORKDIR {workdir}
CMD ["--credential", "{credentials}", "--reconnect", "/bin/sh"]