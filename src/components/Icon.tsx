const names = [
  "alert",
  "arrow-right",
  "book",
  "check",
  "chevron-right",
  "clock",
  "dashboard",
  "edit",
  "eye",
  "grades",
  "help",
  "lock",
  "logout",
  "mail",
  "plus",
  "search",
  "shield",
  "students",
  "trash",
  "users",
] as const;
export type IconName = (typeof names)[number];
export function Icon({ name }: { name: IconName }) {
  return (
    <img
      className="icon"
      src={`/assets/icons/${names.includes(name) ? name : "help"}.svg`}
      alt=""
      aria-hidden="true"
    />
  );
}
