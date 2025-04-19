import Dexie, { type EntityTable } from "dexie";
import type { GlobalPersistedStateTable } from "./persisted";
import type { GlobalAuthTableEntry } from "./auth";

export const globalDatabase = new Dexie("impoexpo") as Dexie & {
	auth: EntityTable<GlobalAuthTableEntry, "integration">;
	persisted: EntityTable<GlobalPersistedStateTable, "type">;
};

globalDatabase.version(1).stores({
	// do not index data here
	auth: "integration",
	persisted: "type",
});
