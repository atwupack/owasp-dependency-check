/** @type {import('knip').KnipConfig} */
const config = {
  entry: ["src/dependency-check.ts", "src/*.spec.ts"],
  project: ["src/*.ts"],
};

export default config;
