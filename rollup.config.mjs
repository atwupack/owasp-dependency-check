import terser from "@rollup/plugin-terser";

export default {
  input: "build/dependency-check.js",
  output: { file: "dist/dependency-check.js", format: "es" },
  external: [
    "purify-ts",
    "extract-zip",
    "node:path",
    "cross-spawn",
    "ansis",
    "node:fs",
    "node:os",
    "undici",
    "@commander-js/extra-typings",
    "yup",
  ],
  plugins: [terser()],
};
