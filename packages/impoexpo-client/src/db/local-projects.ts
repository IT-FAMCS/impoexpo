import { createProjectSnapshot, type ProjectSnapshot } from "./snapshot";
import { globalDatabase } from "./global-database";
import * as uuid from "uuid";

export interface LocalProjectsTableEntry {
	id: string;
	name: string;
	group?: string;
	snapshot: ProjectSnapshot;
}

export const saveNewLocalProject = async (
	name: string,
	group?: string,
): Promise<string> => {
	let id = uuid.v4();
	while (await globalDatabase.localProjects.get(id)) id = uuid.v4();
	await globalDatabase.localProjects.put({
		id,
		name,
		group,
		snapshot: await createProjectSnapshot("complete"),
	});
	return id;
};

export const updateLocalProject = async (id: string) => {
	const project = await getLocalProject(id);
	if (!project)
		throw new Error(`project with id "${id}" doesn't exist in the iDB`);
	await globalDatabase.localProjects.put({
		...project,
		snapshot: await createProjectSnapshot("complete"),
	});
};

export const getExistingGroups = async () =>
	Array.from(
		new Set(
			(await getAllLocalProjects())
				.map((p) => p.group ?? "")
				.filter((g) => g !== ""),
		),
	);

export const getLocalProject = async (id: string) =>
	await globalDatabase.localProjects.get(id);

export const getAllLocalProjects = async () =>
	await globalDatabase.localProjects.toArray();

export const removeLocalProject = async (id: string) => {
	await globalDatabase.localProjects.delete(id);
};
