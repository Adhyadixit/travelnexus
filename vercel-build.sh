#!/bin/bash

# Custom build script for Vercel deployment
echo "Starting Vercel build process..."

# Set environment variable to auto-accept migrations
export DRIZZLE_ACCEPT_DATA_LOSS=true

# Run drizzle-kit push with auto-accept
echo "Running database migrations..."
npx drizzle-kit push --accept-data-loss

# Run the build
echo "Building frontend..."
npm run build

# Compile TypeScript for serverless functions
echo "Compiling TypeScript for serverless functions..."
npx tsc --project tsconfig.vercel.json

echo "Build completed successfully!"
