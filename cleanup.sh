#!/bin/bash
# Script untuk menghapus node_modules sebelum deploy

echo "🧹 Menghapus node_modules..."
rm -rf node_modules

echo "✅ node_modules sudah dihapus"
echo "📦 Dependencies akan di-install ulang oleh build environment"
