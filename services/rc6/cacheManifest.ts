import { getRc6CachePolicy } from "./cachePolicy";
import {
  RC6_RUNTIME_DATASETS,
  type Rc6DatasetName,
  type Rc6DatasetState,
  type Rc6Snapshot,
} from "./runtimeContract";

export type Rc6ManifestDatasetState = Rc6DatasetState | "AUTHORITATIVE_EMPTY";

export type Rc6CacheManifestEntry = Readonly<{
  dataset: Rc6DatasetName;
  tabName: string;
  snapshot: Rc6Snapshot;
  datasetVersion: string;
  checksum: string;
  state: Rc6ManifestDatasetState;
  sourcePublicationTimestamp: string | null;
  lastSuccessfulRefresh: string;
  hardStaleMs: number | null;
  dependencyVersions: Readonly<Record<string, string>>;
}>;

export type Rc6CacheManifest = Readonly<{
  runtimeVersion: string;
  generatedAt: string;
  datasets: Readonly<Record<Rc6DatasetName, Rc6CacheManifestEntry>>;
}>;

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function validTimestamp(value: string | null): boolean {
  return value === null || Number.isFinite(Date.parse(value));
}

export function expectedRc6ManifestState(name: Rc6DatasetName): Rc6ManifestDatasetState {
  const dataset = RC6_RUNTIME_DATASETS[name];
  return dataset.authoritativeEmpty ? "AUTHORITATIVE_EMPTY" : dataset.state;
}

export function validateRc6CacheManifestEntry(entry: Rc6CacheManifestEntry): readonly string[] {
  const errors: string[] = [];
  const contract = RC6_RUNTIME_DATASETS[entry.dataset];
  const policy = getRc6CachePolicy(entry.dataset);

  if (entry.tabName !== contract.tabName) errors.push("tab-name-mismatch");
  if (entry.snapshot !== contract.snapshot) errors.push("snapshot-mismatch");
  if (entry.state !== expectedRc6ManifestState(entry.dataset)) errors.push("dataset-state-mismatch");
  if (!nonEmpty(entry.datasetVersion)) errors.push("missing-dataset-version");
  if (!nonEmpty(entry.checksum)) errors.push("missing-checksum");
  if (!validTimestamp(entry.sourcePublicationTimestamp)) errors.push("invalid-source-publication-timestamp");
  if (!validTimestamp(entry.lastSuccessfulRefresh)) errors.push("invalid-last-successful-refresh");
  if (entry.hardStaleMs !== policy.hardStaleMs) errors.push("hard-stale-policy-mismatch");

  return errors;
}

export function validateRc6CacheManifest(manifest: Rc6CacheManifest): readonly string[] {
  const errors: string[] = [];
  if (!nonEmpty(manifest.runtimeVersion)) errors.push("missing-runtime-version");
  if (!validTimestamp(manifest.generatedAt)) errors.push("invalid-generated-at");

  for (const name of Object.keys(RC6_RUNTIME_DATASETS) as Rc6DatasetName[]) {
    const entry = manifest.datasets[name];
    if (!entry) {
      errors.push(`missing-dataset:${name}`);
      continue;
    }
    for (const error of validateRc6CacheManifestEntry(entry)) {
      errors.push(`${name}:${error}`);
    }
  }

  return errors;
}

export function isRc6ManifestEntryUsable(
  entry: Rc6CacheManifestEntry,
  nowMs: number = Date.now(),
): boolean {
  if (validateRc6CacheManifestEntry(entry).length > 0) return false;
  if (entry.hardStaleMs === null) return true;

  const refreshedAt = Date.parse(entry.lastSuccessfulRefresh);
  if (!Number.isFinite(refreshedAt)) return false;
  return nowMs - refreshedAt <= entry.hardStaleMs;
}
