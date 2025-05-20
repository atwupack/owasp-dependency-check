# Changelog

## Version 0.3.0

- Added a new CLI option `--github-token` to set a GitHub access token to authenticate against the GitHub API. This can be used to increase the rate limit of the API, especially in corporate VPNs.

## Version 0.4.0

- Added support for the environment variable GITHUB_TOKEN which can be used instead of the `--github-token` parameter. The CLI parameter takes precedence over the environment variable.
- Added support for the environment variable NVD_API_KEY. If set and `--nvdApiKey` is not provided on the command line, this will set the parameter `--nvdApiKey` while calling the OWASP Dependency Check tool.
- The output of the OWASP dependency-check is displayed during execution of the tool.

## Version 0.4.1

- Fixed bug with default `--data` directory on Windows.

## Version 0.5.0

- Removed creation of a log file if an error occurs during installation.
- The exit code is always not equal to zero if an error occurs. The exit code of the OWASP Dependency Check tool will be used as the exit code for this program.
- Added parameter `--ignore-errors` which forces the program to always exit with code 0.
- Filter secrets from the output of the dependency-check-cli command being executed.
- Use `JAVA_OPTS` instead of `JAVA_TOOL_OPTIONS` to pass proxy configuration to the dependency-check-cli. This prevents the JVM from printing the proxy's password to stderr.

## Version 0.5.1

- Added missing shebang which prevented the tool from running correctly.
