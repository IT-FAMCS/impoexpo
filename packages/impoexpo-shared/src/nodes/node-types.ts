import type * as v from "valibot";
import {
	genericEntries,
	unwrapNodeIfNeeded,
	replaceGenericWithSchema,
} from "./node-utils";
import { schemaToString } from "./schema-string-conversions";

export type ObjectEntry = v.ObjectEntries[string];

export type NodePropertyOptions<TProperty extends ObjectEntry> =
	TProperty extends v.OptionalSchema<
		infer TWrappedSchema extends ObjectEntry,
		unknown
	>
		? NodePropertyOptions<TWrappedSchema>
		: TProperty extends v.PicklistSchema<infer TOptions, undefined>
			? TOptions[number]
			: TProperty extends v.EnumSchema<
						infer TOptions extends Record<string, string | number>,
						undefined
					>
				? keyof TOptions
				: never;

export type BaseNodeEntry = {
	name: string;
	source: "input" | "output";
	type: string;
	generics: string[] | undefined;
	schema: ObjectEntry;
};

export class BaseNode<
	TIn extends v.ObjectEntries = Record<string, never>,
	TOut extends v.ObjectEntries = Record<string, never>,
	TInMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TOutMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
> {
	public name!: string;
	public category!: string;

	public inputSchema?: v.ObjectSchema<TIn, TInMessages> = undefined;
	public outputSchema?: v.ObjectSchema<TOut, TOutMessages> = undefined;

	public genericTypes: Record<string, string | null> = {};
	public iterable: boolean;

	constructor(
		init: Partial<BaseNode<TIn, TOut>> &
			Pick<BaseNode<TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
		this.fillGenericTypes();
		this.iterable = init.iterable ?? false;
	}

	fillGenericTypes() {
		const genericTypes: Record<string, null> = {};
		for (const entry of [
			...Object.values(this.inputSchema?.entries ?? {}),
			...Object.values(this.outputSchema?.entries ?? {}),
		]) {
			const types = genericEntries(entry) ?? [];
			for (const type of types) genericTypes[type] = null;
		}
		this.genericTypes = genericTypes;
	}

	public resolveGenericType(resolvedType: string, resolvedWith: ObjectEntry) {
		for (const key of [
			...Object.keys(this.inputSchema?.entries ?? {}),
			...Object.keys(this.outputSchema?.entries ?? {}),
		]) {
			const entry = this.entry(key);
			if (entry.generics) {
				Object.assign(
					entry.source === "input"
						? // biome-ignore lint/style/noNonNullAssertion: this.entry will throw if entry is not found
							this.inputSchema!.entries
						: // biome-ignore lint/style/noNonNullAssertion: this.entry will throw if entry is not found
							this.outputSchema!.entries,
					{
						[key]: replaceGenericWithSchema(
							entry.schema,
							resolvedWith,
							resolvedType,
						),
					},
				);
			}
		}

		this.genericTypes[resolvedType] = schemaToString(resolvedWith);
	}

	public hasEntry(key: string) {
		return (
			(this.inputSchema && key in this.inputSchema.entries) ||
			(this.outputSchema && key in this.outputSchema.entries)
		);
	}

	basicEntry(key: string): {
		name: string;
		source: "input" | "output";
		schema: ObjectEntry;
	} {
		if (this.inputSchema && key in this.inputSchema.entries) {
			return {
				name: key,
				source: "input",
				schema: this.inputSchema.entries[key],
			};
		}
		if (this.outputSchema && key in this.outputSchema.entries) {
			return {
				name: key,
				source: "output",
				schema: this.outputSchema.entries[key],
			};
		}
		throw new Error(
			`couldn't pick entry "${key}" in node with type "${this.category}-${this.name}"`,
		);
	}

	public entry(key: string): BaseNodeEntry {
		const basic = this.basicEntry(key);
		const type = schemaToString(unwrapNodeIfNeeded(basic.schema));
		const generics = genericEntries(basic.schema);
		return {
			...basic,
			type: type,
			generics: !generics || generics.length === 0 ? undefined : generics,
		};
	}
}
