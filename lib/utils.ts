export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function siteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://willitfit.com";
  return `${base.replace(/\/$/, "")}${path}`;
}
