import { globalDatabase } from "./global-database";
import * as uuid from "uuid";

export interface GlobalFilesTableEntry {
	id: string;
	filename?: string;
	mimeType: string;
	data: ArrayBuffer;
}

export const saveFile = async (file: File): Promise<string> => {
	const id = uuid.v4();
	await globalDatabase.files.put({
		id: id,
		filename: file.name,
		data: await file.bytes(),
		mimeType: file.type,
	});
	return id;
};

export const getFile = async (
	id: string,
): Promise<GlobalFilesTableEntry | undefined> =>
	await globalDatabase.files.get(id);

export const removeFile = async (id: string) =>
	await globalDatabase.files.delete(id);
