import * as v from "valibot";
import { isArray, isNullable, unwrapNodeIfNeeded } from "./node-utils";

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

	public inputSchema?: v.ObjectSchema<TIn, TInMessages> = undefined;
	public outputSchema?: v.ObjectSchema<TOut, TOutMessages> = undefined;

	genericProperties: Record<string, string[]> = {};

	constructor(
		init: Partial<BaseNode<TIn, TOut>> &
			Pick<BaseNode<TIn, TOut>, "name" | "category"> & {
				genericProperties?: Record<
					string,
					(
						| v.ObjectKeys<v.ObjectSchema<TIn, TInMessages>>["0"]
						| v.ObjectKeys<v.ObjectSchema<TOut, TOutMessages>>["0"]
					)[]
				>;
			},
	) {
		Object.assign(this, init);
		if (init.genericProperties === undefined) this.genericProperties = {};
	}

	public resolveGenericEntry(key: string, resolvedWith: ObjectEntry) {
		const entry = this.entry(key);

		const replaceUnknownWithSchema = (root: ObjectEntry): ObjectEntry => {
			if (root.type === "unknown") return resolvedWith;
			if (isArray(root)) return v.array(replaceUnknownWithSchema(root.item));
			if (isNullable(root))
				return v.nullable(replaceUnknownWithSchema(root.wrapped));

			throw new Error(
				`BaseNode.resolveGenericEntry.replaceUnknownWithSchema failed: couldn't process node: ${root}`,
			);
		};

		if (entry.source === "input" && this.inputSchema) {
			Object.assign(this.inputSchema.entries, {
				[key]: replaceUnknownWithSchema(entry.schema),
			});
		} else if (entry.source === "output" && this.outputSchema) {
			Object.assign(this.outputSchema.entries, {
				[key]: replaceUnknownWithSchema(entry.schema),
			});
		}
	}

	public hasEntry(key: string) {
		return (
			(this.inputSchema && key in this.inputSchema.entries) ||
			(this.outputSchema && key in this.outputSchema.entries)
		);
	}

	public entry(key: string, unwrap = false): BaseNodeEntry {
		if (this.inputSchema && key in this.inputSchema.entries) {
			const rawSchema = this.inputSchema.entries[key];
			const typeData = this.type(key, rawSchema);
			return {
				name: key,
				source: "input",
				type: typeData.type,
				generic: typeData.generic,
				schema: unwrap ? unwrapNodeIfNeeded(rawSchema) : rawSchema,
			};
		}
		if (this.outputSchema && key in this.outputSchema.entries) {
			const rawSchema = this.outputSchema.entries[key];
			const typeData = this.type(key, rawSchema);
			return {
				name: key,
				source: "output",
				type: typeData.type,
				generic: typeData.generic,
				schema: unwrap ? unwrapNodeIfNeeded(rawSchema) : rawSchema,
			};
		}

		throw new Error(
			`couldn't pick entry "${key}" in node with type "${this.category}-${this.name}"`,
		);
	}

	type(
		key: string,
		schema: ObjectEntry,
	): {
		type: string;
		generic?: string;
	} {
		const get = (schema: ObjectEntry, genericName?: string): string => {
			if (schema.type === "unknown")
				return genericName ? genericName : "unknown";
			if (isArray(schema)) return `Array<${get(schema.item, genericName)}>`;
			if (isNullable(schema))
				return `${get(schema.wrapped, genericName)}${isNullable(schema.wrapped) ? "" : " | null"}`;
			return schema.expects;
		};

		const unwrapped = unwrapNodeIfNeeded(schema);
		if (Object.values(this.genericProperties).some((x) => x.includes(key))) {
			const generic = // biome-ignore lint/style/noNonNullAssertion: checked above
				Object.entries(this.genericProperties).find((x) =>
					x[1].includes(key),
				)![0];
			return {
				type: get(unwrapped, generic),
				generic: generic,
			};
		}

		return {
			type: get(unwrapped),
			generic: undefined,
		};
	}
}
