import { logger } from "../logger";
import * as fs from "node:fs/promises";
import * as crypto from "node:crypto";

let key: Uint8Array;
export const loadOrCreateKey = async () => {
	const exists = await fs.stat("aes.key").then(
		() => true,
		() => false,
	);
	if (!exists) {
		logger.warn(
			"creating an aes.key file for storing the AES-256 encryption key. DO NOT DELETE IT, AND DO NOT SHARE IT ANYWHERE.",
		);
		key = crypto.randomBytes(32);
		await fs.writeFile("aes.key", key, "binary");
	} else key = await fs.readFile("aes.key");
};

export const encryptString = (
	str: string,
	inputEncoding: BufferEncoding = "utf8",
	outputEncoding: BufferEncoding = "base64",
) => {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	return Buffer.concat([
		cipher.update(str, inputEncoding),
		cipher.final(),
		iv,
		cipher.getAuthTag(),
	]).toString(outputEncoding);
};

export const encryptObject = (
	obj: unknown,
	outputEncoding: BufferEncoding = "base64",
) => encryptString(JSON.stringify(obj), "utf8", outputEncoding);

export const decryptString = (
	str: string,
	inputEncoding: BufferEncoding = "base64",
	outputEncoding: BufferEncoding = "utf8",
) => {
	const buffer = Buffer.from(str, inputEncoding);
	const iv = buffer.subarray(buffer.length - 28, buffer.length - 16);
	const tag = buffer.subarray(buffer.length - 16);
	const rest = buffer.subarray(0, buffer.length - 28);

	const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(rest), decipher.final()]).toString(
		outputEncoding,
	);
};
