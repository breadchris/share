# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk --no-cache add git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application (ignore go.work to avoid version conflicts)
RUN GOWORK=off CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o main .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata curl

# Create app user
RUN addgroup -g 1001 app && \
    adduser -D -s /bin/sh -u 1001 -G app app

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Create necessary directories and set permissions
RUN mkdir -p /app/data /app/static /app/templates /app/config && \
    chown -R app:app /app

# Copy static assets only if they exist in builder
RUN --mount=from=builder,source=/app/static,target=/tmp/static,rw \
    if [ -d "/tmp/static" ] && [ "$(ls -A /tmp/static 2>/dev/null)" ]; then \
      cp -r /tmp/static/* ./static/ && chown -R app:app ./static; \
    fi
RUN --mount=from=builder,source=/app/templates,target=/tmp/templates,rw \
    if [ -d "/tmp/templates" ] && [ "$(ls -A /tmp/templates 2>/dev/null)" ]; then \
      cp -r /tmp/templates/* ./templates/ && chown -R app:app ./templates; \
    fi

# Create data directory for SQLite and uploads
VOLUME ["/app/data"]

# Expose port
EXPOSE 8080

# Switch to app user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV CONFIG_MODE=k8s
ENV PORT=8080

# Run the application
CMD ["./main", "start", "--port=8080"]