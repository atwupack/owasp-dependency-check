import { Maybe } from "purify-ts";
import fs from "node:fs";
import * as yup from "yup";

export function ensureError(error: unknown): Error {
  if (error instanceof Error) return error;

  let stringified: string;
  try {
    stringified = JSON.stringify(error);
  } catch {
    stringified = "[Unable to stringify the thrown value]";
  }

  return new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
}

const SECRET_REGEX = /(-\S*(?:key|token|pass)[^\s=]*(?:=| +))(\S*)/gi;

export function hideSecrets(input: string) {
  return input.replace(SECRET_REGEX, "$1<secret value>");
}

export function orThrow<T>(value: Maybe<T>, error: string): T {
  return value.toEither(new Error(error)).unsafeCoerce();
}

const packageInfoSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
});

export function readPackageJson() {
  return Maybe.encase(() => {
    const packageJson = fs.readFileSync("package.json").toString();
    return packageInfoSchema.validateSync(JSON.parse(packageJson), {
      strict: true,
    });
  });
}
