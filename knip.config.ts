import { type KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/dependency-check.ts"],
  project: ["src/*.ts"],
  ignore: ["src/*.spec.ts"],
};

export default config;
