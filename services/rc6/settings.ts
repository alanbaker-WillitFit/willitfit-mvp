import { readRc6Dataset, type Rc6TabReader } from "./runtimeReader";

type RuntimeRow = Record<string, string>;

export type Rc6Settings = Readonly<{
  willItFlyNavEnabled: boolean;
  willItFlyNavUrl: string;
  runtimeRole: string;
  publicationState: string;
  cutoverAuthorised: boolean;
}>;

const DEFAULT_SETTINGS: Rc6Settings = Object.freeze({
  willItFlyNavEnabled: false,
  willItFlyNavUrl: "",
  runtimeRole: "",
  publicationState: "",
  cutoverAuthorised: false,
});

function normaliseBoolean(value: string | undefined): boolean {
  return ["yes", "true", "1", "active", "enabled"].includes(String(value ?? "").trim().toLowerCase());
}

function controlMap(rows: readonly RuntimeRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const field = String(row["Control Field"] ?? "").trim();
    if (!field) continue;
    map.set(field, String(row.Value ?? "").trim());
  }
  return map;
}

export async function getRc6Settings(reader: Rc6TabReader): Promise<Rc6Settings> {
  const result = await readRc6Dataset<RuntimeRow>("settings", reader);
  if (result.state !== "READY_WITH_ROWS") return DEFAULT_SETTINGS;

  const controls = controlMap(result.rows);
  const navEnabled = normaliseBoolean(controls.get("willitfly_nav_enabled"));
  const navUrl = controls.get("willitfly_nav_url") ?? "";
  const safeNavUrl = /^https:\/\//i.test(navUrl) ? navUrl : "";

  return Object.freeze({
    willItFlyNavEnabled: navEnabled && Boolean(safeNavUrl),
    willItFlyNavUrl: safeNavUrl,
    runtimeRole: controls.get("runtime_role") ?? "",
    publicationState: controls.get("publication_state") ?? "",
    cutoverAuthorised: normaliseBoolean(controls.get("cutover_authorised")),
  });
}
