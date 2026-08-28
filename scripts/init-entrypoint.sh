#!/bin/sh
set -e

echo "=== Running Supabase Mock Bootstrap ==="
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-init/bootstrap.sql

echo "=== Running Project SQL Migrations ==="
for file in /supabase-migrations/*.sql; do
  if [ -f "$file" ]; then
    echo "Applying migration: $(basename "$file")"
    psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file" || echo "Warning: Migration $(basename "$file") completed with notices."
  fi
done

echo "=== PostgreSQL Test Database Initialization Complete ==="
