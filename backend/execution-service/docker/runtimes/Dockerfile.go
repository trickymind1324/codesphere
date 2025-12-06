FROM golang:1.21-bookworm

# Set working directory
WORKDIR /app

# Install security updates
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 coderunner && \
    chown -R coderunner:coderunner /app

# Switch to non-root user
USER coderunner

# Default command (compile and run Go code)
CMD ["sh", "-c", "go run solution.go"]
