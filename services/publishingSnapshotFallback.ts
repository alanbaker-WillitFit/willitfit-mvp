export type SnapshotSlot = "current" | "previous";

export type SnapshotReadResult<T> = {
  value: T | null;
  slot: SnapshotSlot | null;
};

export async function readWithBuildFallback<T>(
  read: (slot: SnapshotSlot) => Promise<T | null>,
  validate: (value: T) => boolean,
): Promise<SnapshotReadResult<T>> {
  for (const slot of ["current", "previous"] as const) {
    const value = await read(slot);
    if (value !== null && validate(value)) return { value, slot };
  }
  return { value: null, slot: null };
}
