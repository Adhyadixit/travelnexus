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


echo "Build completed successfully!"
