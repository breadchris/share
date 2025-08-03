# Dockerfile for Flow/Worklet Service
# Multi-stage build for optimized production image

# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worklet ./flow/worklet/cmd

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates git docker-cli curl

# Create app user
RUN addgroup -g 1001 app && \
    adduser -D -s /bin/sh -u 1001 -G app app

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/worklet .

# Copy configuration files
COPY --from=builder /app/config/ ./config/

# Create directories
RUN mkdir -p /tmp/worklet-repos && \
    chown -R app:app /app /tmp/worklet-repos

# Expose port
EXPOSE 8080

# Switch to app user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["./worklet"]