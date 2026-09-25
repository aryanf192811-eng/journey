#!/bin/sh
# infrastructure/docker/init-db.sh
# The official postgres image only auto-runs files placed directly in
# /docker-entrypoint-initdb.d, not subdirectories — so this script runs
# migrations then seed data explicitly, in filename order.
set -e

for f in /migrations/*.sql; do
  echo "Applying migration: $f"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done

for f in /seed/*.sql; do
  echo "Applying seed: $f"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
