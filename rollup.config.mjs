import terser from "@rollup/plugin-terser";

export default {
  input: "build/dependency-check.js",
  output: {
    file: "dist/dependency-check.js",
    format: "es",
  },
  plugins: [terser()],
};
