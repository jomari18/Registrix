import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
export function createRecoveryClient() {
  return config.configured
    ? createClient(config.url, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "registrix-password-recovery",
        },
      })
    : null;
}
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
