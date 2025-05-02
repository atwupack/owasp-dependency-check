# owasp-dependency-check

[![build](https://github.com/atwupack/owasp-dependency-check/actions/workflows/build.yml/badge.svg)](https://github.com/atwupack/owasp-dependency-check/actions/workflows/build.yml)
[![npm-publish](https://github.com/atwupack/owasp-dependency-check/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/atwupack/owasp-dependency-check/actions/workflows/npm-publish.yml)

This is a fork of [etnetera/owasp-dependency-check](https://github.com/etnetera/owasp-dependency-check) which is no longer maintained.

> ⚠️ Requires **Node.js** version 14 or greater.

Node.js wrapper for the [OWASP dependency-check CLI tool](https://dependency-check.github.io/DependencyCheck/).

```
npm install -D owasp-dependency-check
```

## Usage

The easiest way is to add a new NPM script to your `package.json`, for example:

```
"scripts": {
  ...
  "owasp": "owasp-dependency-check --project \"YOUR PROJECT NAME\" [options]"
}
```

## Options

### Owasp Dependency Core options

You can specify any options which the [OWASP depencency-check CLI tool](https://dependency-check.github.io/DependencyCheck/) provides. For example, to generate a HTML and JSON report, use:

```
"scripts": {
  ...
  "owasp": "owasp-dependency-check --project \"YOUR PROJECT NAME\" -f HTML -f JSON"
}
```

### Additional options

Use `owasp-dependency-check --help` to check other options.

## TODOs before Version 1.0.0

- [ ] Add support for proxies (started)
- [ ] Improve logging
- [ ] Improve error handling
- [ ] Maybe conversion to TypeScript
- [ ] Add unit tests