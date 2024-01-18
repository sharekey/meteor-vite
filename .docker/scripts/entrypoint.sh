#!/bin/bash

set -o errexit

echo 'Starting app...'
cd $APP_BUNDLE_FOLDER/bundle

MONGO_URL=$(echo "$MONGO_URL" | MONGO_DATABASE="$APP_BASENAME" envsubst)
export MONGO_URL

exec "$@"