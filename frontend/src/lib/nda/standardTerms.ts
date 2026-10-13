import "server-only";

import source from "../../../../templates/Mutual-NDA.md";
import { parseStandardTerms } from "../markdown";

/** The MNDA Standard Terms from the repo's templates/ dataset, bundled at build time. */
export const standardTerms = parseStandardTerms(source);
