# Changelog

## Version 0.8.0

- Clean `--bin` directory before installing a new version of the dependency-check-cli.
- Added parameter `--keep-old-versions` to prevent removal of other installations in `--bin` directory.
- The dependency `@colors/colors` has been replaced with `ansis`.
- The dependency `commander` has been upgraded to version 14.
- Added parameter `--java-bin` to set Java binary.\
  This sets the `JAVACMD` environment variable before calling the dependency-check-cli.

## Version 0.7.1

- Use `rollup` and `terser` to create a single file compressed release version.
- Removed `CHANGELOG.md` from release package.

## Version 0.7.0

- The output of the `--version` parameter was fixed. It now displays the version of owasp-dependency-check instead of the version of the analyzed project.
- The dependencies `node-fetch` and `nodejs-file-downloader` have been replaced with `undici`.
- The dependency `rimraf` has been replaced with `fsPromises.rm()`.
- Remove the downloaded zip file after successfully unzipping it.

## Version 0.6.0

- Changed behavior of the `--odc-version` parameter. If the version is not specified, the latest version of the dependency-check-cli will be used. The explicit value `latest` is no longer supported.
- If no explicit version of the dependency-check-cli is specified, and the latest available version is not yet installed, it will be downloaded and used.
- Added parameter `--hide-owasp-output` to not display logging from the dependency-check-cli during execution.

## Version 0.5.1

- Added missing shebang which prevented the program from running correctly.

## Version 0.5.0

- Removed creation of a log file if an error occurs during installation.
- The exit code is always not equal to zero if an error occurs. The exit code of the dependency-check-cli will be used as the exit code for this program.
- Added parameter `--ignore-errors` which forces the program to always exit with code 0.
- Filter secrets from the output of the dependency-check-cli command being executed.
- Use `JAVA_OPTS` instead of `JAVA_TOOL_OPTIONS` to pass proxy configuration to the dependency-check-cli. This prevents the JVM from printing the proxy's password to stderr.

## Version 0.4.1

- Fixed bug with default `--data` directory on Windows.

## Version 0.4.0

- Added support for the environment variable GITHUB_TOKEN which can be used instead of the `--github-token` parameter. The CLI parameter takes precedence over the environment variable.
- Added support for the environment variable NVD_API_KEY. If set and `--nvdApiKey` is not provided on the command line, this will set the parameter `--nvdApiKey` while calling the dependency-check-cli.
- The output of the dependency-check-cli is displayed during execution.

## Version 0.3.0

- Added a new CLI option `--github-token` to set a GitHub access token to authenticate against the GitHub API. This can be used to increase the rate limit of the API, especially in corporate VPNs.
