FROM gcc:13-bookworm

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

# Default command (compile and run)
CMD ["sh", "-c", "g++ -std=c++17 -O2 solution.cpp -o solution && ./solution"]
