import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { logger } from "./logger";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn(
    { svc: "supabase" },
    "Supabase credentials missing from environment — any route that hits Postgres will fail.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
