/** @type {import('knip').KnipConfig} */
const config = {
  entry: ["src/dependency-check.ts"],
  project: ["src/*.ts"],
  ignore: ["src/*.spec.ts"],
};

export default config;
