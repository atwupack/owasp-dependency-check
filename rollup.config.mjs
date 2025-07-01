import terser from "@rollup/plugin-terser";

export default {
  input: "build/dependency-check.js",
  output: {
    file: "dist/dependency-check.js",
    format: "es",
  },
  external: [
    "purify-ts",
    "extract-zip",
    "node:fs/promises",
    "path",
    "cross-spawn",
    "ansis",
    "fs",
    "os",
    "undici",
    "@commander-js/extra-typings",
  ],
  plugins: [terser()],
};
