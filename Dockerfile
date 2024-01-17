# Node.js Version to run our production server.
# This needs to match as what's expected by our current meteor release;
# https://docs.meteor.com/changelog.html
ARG NODE_VERSION="14-alpine"

# Meteor release (Needs to match the release in .meteor/release)
ARG METEOR_RELEASE="2.12"

# Path relative to the repository root to the Meteor app to build
# Ex: ./examples/vue
ARG APP_DIR

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
ARG APP_DIR
RUN test -n "$APP_DIR"

ENV APP_DIR $APP_DIR
ENV METEOR_PACKAGES_FOLDER /root/packages
ENV NPM_PACKAGES_FOLDER /root/npm-packages
ENV METEOR_PACKAGE_DIRS $METEOR_PACKAGES_FOLDER

COPY ./packages $METEOR_PACKAGES_FOLDER
COPY ./npm-packages $NPM_PACKAGES_FOLDER

# Prepare meteor-vite package for local reference when preparing npm dependencies.
RUN cd $NPM_PACKAGES_FOLDER/meteor-vite && meteor npm link

WORKDIR $APP_SOURCE_FOLDER

# Meteor.js base image with pre-built npm and atmosphere dependencies
FROM meteor-base as meteor-bundler

# Prepare files needed for building Meteor packages and npm dependencies.
COPY $APP_DIR/package*.json $APP_SOURCE_FOLDER/

# Install npm dependencies
RUN bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh
RUN meteor npm link meteor-vite

# Copy application source code
COPY $APP_DIR $APP_SOURCE_FOLDER/

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