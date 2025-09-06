import Dexie, { type EntityTable } from "dexie";
import type { GlobalPersistedStateTable } from "./persisted";
import type { GlobalAuthTableEntry } from "./auth";
import type { GlobalFilesTableEntry } from "./files";
import type { LocalProjectsTableEntry } from "./local-projects";

export const globalDatabase = new Dexie("impoexpo") as Dexie & {
	auth: EntityTable<GlobalAuthTableEntry, "integration">;
	persisted: EntityTable<GlobalPersistedStateTable, "type">;
	files: EntityTable<GlobalFilesTableEntry, "hash">;
	localProjects: EntityTable<LocalProjectsTableEntry, "id">;
};

globalDatabase.version(1).stores({
	// do not index data here
	auth: "integration",
	persisted: "type",
	files: "hash,filename,mimeType",
	localProjects: "id,name,group",
});
