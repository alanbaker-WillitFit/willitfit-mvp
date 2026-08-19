import {
  RC6_RUNTIME_DATASETS,
  type Rc6DatasetContract,
  type Rc6DatasetName,
} from "./runtimeContract";
import { rc6DatasetConsumptionBlock } from "./consumptionPolicy";
import { validateRc6Headers } from "./schemaRegistry";

export type Rc6RuntimeReadState =
  | "READY_WITH_ROWS"
  | "AUTHORITATIVE_EMPTY"
  | "HELD_OR_NOT_PUBLIC"
  | "READ_OR_SCHEMA_FAILURE";

export interface Rc6RuntimeReadResult<T> {
  dataset: Rc6DatasetContract;
  state: Rc6RuntimeReadState;
  rows: T[];
  error?: string;
}

export type Rc6TabReader = <T extends Record<string, string>>(tabName: string) => Promise<T[] | null>;

export async function readRc6Dataset<T extends Record<string, string>>(
  name: Rc6DatasetName,
  reader: Rc6TabReader,
): Promise<Rc6RuntimeReadResult<T>> {
  const dataset = RC6_RUNTIME_DATASETS[name];
  const consumptionBlock = rc6DatasetConsumptionBlock(name);

  if (dataset.state === "HELD" || consumptionBlock) {
    return {
      dataset,
      state: "HELD_OR_NOT_PUBLIC",
      rows: [],
      ...(consumptionBlock ? { error: consumptionBlock } : {}),
    };
  }

  try {
    const rows = await reader<T>(dataset.tabName);

    if (rows === null) {
      return {
        dataset,
        state: "READ_OR_SCHEMA_FAILURE",
        rows: [],
        error: `Runtime dataset ${dataset.tabName} could not be read or validated.`,
      };
    }

    if (rows.length === 0) {
      return {
        dataset,
        state: "AUTHORITATIVE_EMPTY",
        rows: [],
      };
    }

    const headerValidation = validateRc6Headers(name, Object.keys(rows[0] ?? {}));
    if (!headerValidation.valid) {
      return {
        dataset,
        state: "READ_OR_SCHEMA_FAILURE",
        rows: [],
        error: `Runtime dataset ${dataset.tabName} is missing required RC6 headers: ${headerValidation.missing.join(", ")}.`,
      };
    }

    return {
      dataset,
      state: "READY_WITH_ROWS",
      rows,
    };
  } catch (error) {
    return {
      dataset,
      state: "READ_OR_SCHEMA_FAILURE",
      rows: [],
      error: error instanceof Error ? error.message : "Unknown Runtime read failure.",
    };
  }
}

export function canServeRc6Rows<T>(result: Rc6RuntimeReadResult<T>): boolean {
  return result.state === "READY_WITH_ROWS";
}

export function isRc6AuthoritativeEmpty<T>(result: Rc6RuntimeReadResult<T>): boolean {
  return result.state === "AUTHORITATIVE_EMPTY";
}
