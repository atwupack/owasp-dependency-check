import terser from "@rollup/plugin-terser";

export default {
  input: "build/dependency-check.js",
  output: { file: "dist/dependency-check.js", format: "es" },
  external: [
    "purify-ts",
    "yauzl",
    "node:path",
    "cross-spawn",
    "ansis",
    "node:fs",
    "node:os",
    "node:util",
    "node:stream",
    "undici",
    "@commander-js/extra-typings",
    "yup",
  ],
  plugins: [terser()],
};
