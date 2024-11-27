# jorgenvatle_vite

## 1.1.0-alpha.1

### Patch Changes

- e80538d2: Disable 'keepNames' feature from ESBuild - it appears to cause issues with downstream Meteor builds

## 1.1.0-alpha.0

### Minor Changes

- d45e887c: Bump pre-release tag to avoid accidentally published v1 release from taking precedence

## 1.0.0-alpha.3

### Patch Changes

- 60c83997: Wrap dev server bootstrapper around Meteor.startup hook. Workaround for issue where changes to Meteor.settings.public aren't sent to clients. Ref: https://github.com/meteor/meteor/issues/13489

## 1.0.0-alpha.2

### Patch Changes

- f31a8202: Fix builds: disable incompatible Meteor build plugins on startup

## 1.0.0-alpha.1

### Patch Changes

- 9f657993: Pre-release for Vite v6 rewrite. Adds lightning fast server-side HMR
