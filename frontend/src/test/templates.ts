import { readFileSync } from "node:fs";
import path from "node:path";

/** Reads a template from the repo's templates/ directory (the dataset the app bundles at build time). */
export function readTemplate(fileName: string): string {
  return readFileSync(path.join(import.meta.dirname, "../../../templates", fileName), "utf8");
}
