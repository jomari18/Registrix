const url = import.meta.env.VITE_SUPABASE_URL ?? "",
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
function validUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      (u.protocol === "https:" && u.hostname.endsWith(".supabase.co")) ||
      (import.meta.env.DEV &&
        u.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(u.hostname))
    );
  } catch {
    return false;
  }
}
export const config = {
  url,
  key,
  configured:
    validUrl(url) &&
    key.startsWith("sb_publishable_") &&
    !key.includes("YOUR_"),
};
