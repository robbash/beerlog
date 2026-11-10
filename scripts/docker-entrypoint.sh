#!/bin/sh
set -e

# Apply any pending database migrations before the app starts, so a deploy of a
# new image brings its own schema with it.
#
# `migrate deploy` only applies migrations that have not run yet and never
# generates new ones, so it is safe to run on every container start. It takes a
# database-level advisory lock, so concurrent replicas serialise rather than
# race. Set RUN_MIGRATIONS=false to skip this, e.g. when a separate job owns
# migrations or the database user may not alter the schema.

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
  echo "==> Applying database migrations"
  node "$APP_DIR/migrate-tools/node_modules/prisma/build/index.js" migrate deploy \
    --schema "$APP_DIR/prisma/schema.prisma"
  echo "==> Migrations up to date"
fi

exec "$@"
