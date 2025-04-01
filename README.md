# owasp-dependency-check

## ⚠️⚠️ Looking for a maintainer ⚠️⚠️

**We will no longer maintain this package and we are looking for somebody to take over. If you want to continue developing this package, please reach out to me.**

> ⚠️ Requires **Node.js** version 14 or greater.

Node.js wrapper for the [OWASP depencency-check CLI tool](https://jeremylong.github.io/DependencyCheck/dependency-check-cli/index.html).

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

You can specify any options which the [OWASP depencency-check CLI tool](https://jeremylong.github.io/DependencyCheck/dependency-check-cli/index.html) provides. For example, to generate a HTML and JSON report, use:

```
"scripts": {
  ...
  "owasp": "owasp-dependency-check --project \"YOUR PROJECT NAME\" -f HTML -f JSON"
}
```

### Additional options

Use `owasp-dependency-check --help` to check other options.
