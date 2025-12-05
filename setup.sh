#!/bin/bash

echo "🚀 CodeSphere Setup Script"
echo "=========================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Setup Auth Service
echo ""
echo "🔐 Setting up Auth Service..."
cd backend/auth-service

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in auth-service"
    exit 1
fi

npm install
cp .env.example .env 2>/dev/null || true

# Generate JWT keys if script exists
if [ -f "generate-keys.sh" ]; then
    chmod +x generate-keys.sh
    ./generate-keys.sh
fi

echo "✅ Auth Service setup complete"

# Setup Problem Service
echo ""
echo "📝 Setting up Problem Service..."
cd ../problem-service

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in problem-service"
    exit 1
fi

npm install
cp .env.example .env 2>/dev/null || true

echo "✅ Problem Service setup complete"

# Setup Execution Service
echo ""
echo "⚡ Setting up Execution Service..."
cd ../execution-service

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in execution-service"
    exit 1
fi

npm install
cp .env.example .env 2>/dev/null || true

echo "✅ Execution Service setup complete"

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd ../../frontend

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend"
    exit 1
fi

npm install
echo "VITE_API_URL=http://localhost:8000" > .env

echo "✅ Frontend setup complete"

# Back to root
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Run migrations for Auth Service:"
echo "   cd backend/auth-service && npm run migration:run"
echo ""
echo "2. Run migrations for Problem Service:"
echo "   cd backend/problem-service && npm run migration:run"
echo ""
echo "3. Start all services (in separate terminals):"
echo "   Terminal 1: cd backend/auth-service && npm run dev"
echo "   Terminal 2: cd backend/problem-service && npm run dev"
echo "   Terminal 3: cd backend/execution-service && npm run dev"
echo "   Terminal 4: cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For detailed instructions, see SETUP.md"
