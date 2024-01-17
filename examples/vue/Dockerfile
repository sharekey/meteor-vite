# Node.js Version to run our production server.
# This needs to match as what's expected by our current meteor release;
# https://docs.meteor.com/changelog.html
ARG NODE_VERSION="14-alpine"

# Meteor release (Needs to match the release in .meteor/release)
ARG METEOR_RELEASE="2.12"

# Node.js production runtime
# This is the smallest possible image we can use to run the pre-built Meteor bundle.
FROM node:$NODE_VERSION as nodejs-runtime
ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker

# Runtime dependencies; (For node-sass, bcrypt etc.)
RUN apk --no-cache add \
		bash \
		ca-certificates \
		python3 \
		make \
		g++

# Meteor.js Base Image
# Has `meteor` installed for building the production server as well as running any
# development/testing environments if that's more convenient to use.
FROM geoffreybooth/meteor-base:$METEOR_RELEASE as meteor-base
ENV METEOR_CACHE_FOLDER /root/.meteor
ENV METEOR_LOCAL_CACHE_FOLDER $APP_SOURCE_FOLDER/.meteor
ENV NODE_MODULES_FOLDER $APP_SOURCE_FOLDER/node_modules
ENV METEOR_PACKAGES_FOLDER $APP_SOURCE_FOLDER/packages

WORKDIR $APP_SOURCE_FOLDER

# Meteor.js base image with pre-built npm and atmosphere dependencies
FROM meteor-base as meteor-bundler

# Prepare files needed for building Meteor packages and npm dependencies.
COPY ./package*.json $APP_SOURCE_FOLDER/
COPY ./vite.config.ts $APP_SOURCE_FOLDER/
COPY ./tsconfig.json $APP_SOURCE_FOLDER/
COPY --chown=root:root ./.meteor $APP_SOURCE_FOLDER/.meteor

RUN bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh

# Copy application source code
COPY . $APP_SOURCE_FOLDER/

# Build Meteor bundle
RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh

# Meteor Production Server
# This is what we ship to production.
FROM nodejs-runtime as production-server

# Import entrypoint script and production bundle
COPY --from=meteor-bundler $SCRIPTS_FOLDER $SCRIPTS_FOLDER/
COPY --from=meteor-bundler $APP_BUNDLE_FOLDER $APP_BUNDLE_FOLDER/

# Install production npm dependencies
RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh

# Start app
ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["node", "main.js"]