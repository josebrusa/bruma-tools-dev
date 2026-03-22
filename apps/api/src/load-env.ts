import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (…/bruma-tools-dev/.env) */
const repoRootEnv = path.resolve(__dirname, "../../..", ".env");
/** Package-local override (…/apps/api/.env) */
const packageEnv = path.resolve(__dirname, "..", ".env");

config({ path: repoRootEnv });
config({ path: packageEnv });
