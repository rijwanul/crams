#!/bin/bash

# CRAMS Deployment Script for Render
echo "🚀 Starting CRAMS deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
npm run install:server

# Install client dependencies
echo "📦 Installing client dependencies..."
npm run install:client

# Build client for production
echo "🏗️ Building client..."
npm run build --workspace client

echo "✅ Deployment preparation complete!"
echo "🌐 Server will start with: npm start"
