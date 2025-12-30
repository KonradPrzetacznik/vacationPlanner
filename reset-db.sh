#!/bin/bash

# =============================================================================
# Database Reset Script
# =============================================================================
# This script resets the local Supabase database and applies all migrations
# Usage: ./reset-db.sh
# =============================================================================

set -e  # Exit on error

# Supabase command
SUPABASE_CMD="npx supabase"

echo "🗑️  Resetting Supabase database..."
echo ""

# Check if Supabase CLI is available
if ! $SUPABASE_CMD --version &> /dev/null; then
    echo "❌ Error: Supabase CLI is not available"
    echo "Install it with: npm install -D supabase"
    exit 1
fi

# Check if Supabase is running
if ! $SUPABASE_CMD status &> /dev/null; then
    echo "⚠️  Supabase is not running. Starting..."
    $SUPABASE_CMD start
    echo ""
fi

echo "📊 Current database status:"
$SUPABASE_CMD db dump --data-only --schema public | head -n 5 || echo "No data found"
echo ""

# Confirm reset
read -p "⚠️  This will DELETE ALL DATA and reset the database. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔄 Resetting database..."

# Reset the database
$SUPABASE_CMD db reset
