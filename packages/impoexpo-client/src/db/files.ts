import { globalDatabase } from "./global-database";
import { sha256 } from "hash-wasm";

export interface GlobalFilesTableEntry {
	hash: string;
	filename?: string;
	mimeType: string;
	data: ArrayBuffer;
}

export const saveFile = async (file: File): Promise<string> => {
	const hash = await sha256(new Uint8Array(await file.arrayBuffer()));
	// TODO: this is probably prone to errors
	const existingFile = await globalDatabase.files.get({ hash });
	if (!existingFile) {
		await globalDatabase.files.put({
			hash: hash,
			filename: file.name,
			data: await file.arrayBuffer(),
			mimeType: file.type,
		});
	}
	return hash;
};

export const getFile = async (
	hash: string,
): Promise<GlobalFilesTableEntry | undefined> =>
	await globalDatabase.files.get(hash);

export const removeFile = async (hash: string) =>
	await globalDatabase.files.delete(hash);
