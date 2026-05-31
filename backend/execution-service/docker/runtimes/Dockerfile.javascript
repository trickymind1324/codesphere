FROM node:20-slim

# Set working directory
WORKDIR /app

# Install security updates
RUN apt-get update && apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user with a different UID to avoid conflict
RUN useradd -m -u 1001 coderunner && \
    chown -R coderunner:coderunner /app

# Switch to non-root user
USER coderunner

# Default command
CMD ["node", "solution.js"]
