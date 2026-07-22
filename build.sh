#!/bin/bash
set -e

echo "🧹 Cleaning node_modules..."
rm -rf node_modules

echo "📦 Installing dependencies..."
bun install

echo "🚀 Deploying to Cloudflare..."
npx wrangler deploy

echo "✅ Deployment complete!"
