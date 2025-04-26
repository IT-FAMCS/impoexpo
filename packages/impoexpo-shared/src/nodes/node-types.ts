import * as v from "valibot";
import {
	getGenericEntries,
	getGenericName,
	isArray,
	isGeneric,
	isNullable,
	unwrapNodeIfNeeded,
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
	generic?: string;
	schema: ObjectEntry;
};

export class BaseNode<
	// biome-ignore lint/complexity/noBannedTypes: empty type required here
	TIn extends v.ObjectEntries = {},
	// biome-ignore lint/complexity/noBannedTypes: empty type required here
	TOut extends v.ObjectEntries = {},
	TInMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TOutMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
> {
	public name!: string;
	public category!: string;
	public iterable = false;

	public inputSchema?: v.ObjectSchema<TIn, TInMessages> = undefined;
	public outputSchema?: v.ObjectSchema<TOut, TOutMessages> = undefined;

	public genericTypes: Record<string, string | null> = {};

	constructor(
		init: Partial<BaseNode<TIn, TOut>> &
			Pick<BaseNode<TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
		this.fillGenericTypes();
	}

	fillGenericTypes() {
		const genericTypes: Record<string, null> = {};
		for (const entry of [
			...Object.values(this.inputSchema?.entries ?? {}),
			...Object.values(this.outputSchema?.entries ?? {}),
		]) {
			const types = getGenericEntries(entry).map((ge) => getGenericName(ge));
			for (const type of types) genericTypes[type] = null;
		}
		this.genericTypes = genericTypes;
	}

	public resolveGenericType(resolvedType: string, resolvedWith: ObjectEntry) {
		const replaceGenericWithSchema = (
			root: ObjectEntry,
			resolver: ObjectEntry,
			name: string,
		): ObjectEntry => {
			if (isGeneric(root) && getGenericName(root) === name) return resolver;
			if (isArray(root))
				return v.array(replaceGenericWithSchema(root.item, resolver, name));
			if (isNullable(root))
				return v.nullable(
					replaceGenericWithSchema(root.wrapped, resolver, name),
				);

			throw new Error(
				`BaseNode.resolveGenericEntry.replaceUnknownWithSchema failed: couldn't process node: ${JSON.stringify(root)}`,
			);
		};

		for (const key of [
			...Object.keys(this.inputSchema?.entries ?? {}),
			...Object.keys(this.outputSchema?.entries ?? {}),
		]) {
			const entry = this.entry(key);
			if (entry.generic === resolvedType) {
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

		this.genericTypes[resolvedType] = schemaToString(resolvedWith).type;
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
		const typeData = this.type(key);
		return {
			...basic,
			type: typeData.type,
			generic: typeData.generic,
		};
	}

	type(key: string): {
		type: string;
		generic?: string;
	} {
		const basic = this.basicEntry(key);
		const unwrapped = unwrapNodeIfNeeded(basic.schema);
		const schemaString = schemaToString(unwrapped);

		return {
			type: schemaString.type,
			generic: schemaString.generic,
		};
	}
}
