import { QueryClient } from "@tanstack/react-query";
import * as v from "valibot";
import { RatelimitHitError } from "./errors";
import { FaultyActionSchema } from "@impoexpo/shared/schemas/generic/FaultyActionSchema";

export const BACKEND_URL_BASE = import.meta.env.VITE_BACKEND_URL;
export const DOCS_URL_BASE = import.meta.env.VITE_DOCS_URL;
export const queryClient = new QueryClient();

export const route = (path: string, query?: Record<string, string>) => {
	const current = new URL(`${BACKEND_URL_BASE}${path}`);
	current.search = new URLSearchParams(query).toString();
	return current;
};
export const docs = (path: string) => {
	return `${DOCS_URL_BASE}${path}`;
};

export const getWithSchema = async <const TSchema extends v.GenericSchema>(
	path: string,
	schema: TSchema,
	other?: OtherRequestData,
): Promise<v.InferOutput<TSchema>> =>
	v.parse(schema, await (await request("GET", path, undefined, other)).json());
export const postWithSchema = async <const TSchema extends v.GenericSchema>(
	path: string,
	body: v.InferOutput<TSchema>,
	other?: OtherRequestData,
): Promise<Record<string, unknown>> =>
	await (
		await request("POST", path, JSON.stringify(body), {
			...other,
			headers: {
				...other?.headers,
				"Content-Type": "application/json",
			},
		})
	).json();
export const postForm = async (
	path: string,
	body: FormData,
	other?: OtherRequestData,
) => await request("POST", path, body, other);
export const postFormWithResult = async <const TSchema extends v.GenericSchema>(
	path: string,
	body: FormData,
	outSchema: TSchema,
	other?: OtherRequestData,
): Promise<v.InferOutput<TSchema>> =>
	v.parse(outSchema, await (await request("POST", path, body, other)).json());
export const postWithSchemaAndResult = async <
	const TInSchema extends v.GenericSchema,
	const TOutSchema extends v.GenericSchema,
>(
	path: string,
	body: v.InferOutput<TInSchema>,
	outSchema: TOutSchema,
	other?: OtherRequestData,
): Promise<v.InferOutput<TOutSchema>> =>
	v.parse(
		outSchema,
		await (
			await request("POST", path, JSON.stringify(body), {
				...other,
				headers: {
					...other?.headers,
					"Content-Type": "application/json",
				},
			})
		).json(),
	);

export const get = async (path: string, other?: OtherRequestData) =>
	request("GET", path, undefined, other);
export const post = async (
	path: string,
	body: unknown,
	other?: OtherRequestData,
) => request("POST", path, JSON.stringify(body), other);

const request = async (
	method: RequestMethod,
	path: string,
	body?: string | FormData,
	other?: OtherRequestData,
): Promise<Response> => {
	const response = await fetch(route(path, other?.query), {
		method: method,
		headers: getHeaders(other),
		body: body,
	});
	if (!response.ok) {
		if (response.status === 429) throw new RatelimitHitError(response);

		const body = await response.text();
		let error: Error | undefined;
		try {
			const json = JSON.parse(body);
			if (v.is(FaultyActionSchema, json)) {
				error = new Error(v.parse(FaultyActionSchema, json).error);
			}
		} finally {
			if (!error)
				error = new Error(
					`server returned an unsuccessful status code (${response.status}): ${body.length === 0 ? "body was empty" : body}`,
				);
		}

		throw error;
	}
	return response;
};

const getHeaders = (other?: OtherRequestData): HeadersInit => ({
	Authorization:
		other?.authorization === undefined ? "" : `Bearer ${other.authorization}`,
	"Cache-Control": other?.bypassCache ? "no-cache" : "",
	...other?.headers,
});

type OtherRequestData = {
	query?: Record<string, string>;
	authorization?: string;
	headers?: Record<string, string>;
	bypassCache?: boolean;
};
type RequestMethod = "GET" | "POST";
