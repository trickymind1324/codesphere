#!/bin/bash

# Generate RSA key pair for JWT signing (RS256)
# This script creates private and public keys for asymmetric JWT signing

echo "🔐 Generating RSA key pair for JWT signing..."

# Create keys directory if it doesn't exist
mkdir -p keys

# Generate private key (2048 bits)
openssl genrsa -out keys/private.pem 2048

# Extract public key from private key
openssl rsa -in keys/private.pem -outform PEM -pubout -out keys/public.pem

echo "✅ Keys generated successfully!"
echo "📁 Private key: keys/private.pem"
echo "📁 Public key: keys/public.pem"
echo ""
echo "⚠️  IMPORTANT: Never commit private.pem to version control!"
echo "Add 'keys/*.pem' to your .gitignore file."
echo ""
echo "For production, store keys in environment variables or secure vault."
