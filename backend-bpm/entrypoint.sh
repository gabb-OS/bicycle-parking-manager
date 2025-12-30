#!/bin/sh

# Stop on error
set -e

# 1. Always try to upgrade the DB (Safe: if no new migrations, it does nothing)
echo "Checking for database migrations..."
flask db upgrade

if [ "$SEED_DB" = "true" ]; then
    echo "Seeding database..."
    flask seed-db
else
    echo "Skipping database seeding"
fi

# 2. Execute the command passed to the container
# In Prod: This will be "gunicorn ..."
# In Dev:  This will be "flask run ..."
echo "Starting application..."
exec "$@"