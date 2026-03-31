import * as dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

let envLoaded = false;

/**
 * Load backend env once.
 * Priority is process environment; local files are fallback for development.
 */
export function loadBackendEnv(): void {
  if (envLoaded) return;

  const cwdEnvPath = path.resolve(process.cwd(), ".env");
  const backendEnvPath = path.resolve(__dirname, "../../.env");
  const rootEnvPath = path.resolve(__dirname, "../../../.env");

  if (existsSync(cwdEnvPath)) {
    dotenv.config({ path: cwdEnvPath });
  } else if (existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
  } else if (existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else {
    dotenv.config();
  }

  envLoaded = true;
}

loadBackendEnv();
