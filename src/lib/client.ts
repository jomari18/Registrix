import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
export const client = config.configured
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "registrix-auth",
      },
    })
  : null;
