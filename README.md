# owasp-dependency-check

[![build](https://github.com/atwupack/owasp-dependency-check/actions/workflows/build.yml/badge.svg)](https://github.com/atwupack/owasp-dependency-check/actions/workflows/build.yml)
[![npm-publish](https://github.com/atwupack/owasp-dependency-check/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/atwupack/owasp-dependency-check/actions/workflows/npm-publish.yml)
[![npm version](https://badge.fury.io/js/owasp-dependency-check.svg)](https://badge.fury.io/js/owasp-dependency-check)

> ⚠️ If you are upgrading from version 0.0.x, please note the following.
>
> - This package is maintained at [atwupack/owasp-dependency-check](https://github.com/atwupack/owasp-dependency-check).
> - New features as proxy support and GitHub authentication have been added.
> - There have been minor changes like the removal of `latest` and returning the result code from the dependency-check-cli which could cause problems after upgrading.
> - Please check the [CHANGELOG](https://github.com/atwupack/owasp-dependency-check/blob/main/CHANGELOG.md) if you run into any problems.
> - Please report bug reports or feature requests [here](https://github.com/atwupack/owasp-dependency-check/issues).

> ⚠️ Requires **Node.js** version 18 or greater.

## Introduction

This package is a Node.js wrapper for the [OWASP dependency-check-cli](https://dependency-check.github.io/DependencyCheck/).

It is based on the work of [etnetera/owasp-dependency-check](https://github.com/etnetera/owasp-dependency-check).

## Installation

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

You can specify any options that the [OWASP dependency-check CLI tool](https://dependency-check.github.io/DependencyCheck/) provides. For example, to generate an HTML and JSON report, use:

```
"scripts": {
  ...
  "owasp": "owasp-dependency-check --project \"YOUR PROJECT NAME\" -f HTML -f JSON"
}
```

### Additional options

Use `owasp-dependency-check --help` to check other options.
