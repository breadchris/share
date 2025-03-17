FROM cthompson4321/gotty:v0.0.1

RUN adduser -D -s /bin/sh -u 1000 user
COPY --chown=user:user files /home/user/files
WORKDIR /home/user/files
USER user

CMD ["--credential", "user:pass", "--permit-write", "--reconnect", "/bin/sh"]
