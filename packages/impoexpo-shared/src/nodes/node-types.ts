import type * as v from "valibot";
import { isArray, unwrapNodeIfNeeded } from "./node-utils";

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

	public setEntrySchema(key: string, schema: ObjectEntry) {
		if (this.inputSchema && key in this.inputSchema.entries) {
			Object.assign(this.inputSchema.entries, { [key]: schema });
		} else if (this.outputSchema && key in this.outputSchema.entries) {
			Object.assign(this.outputSchema.entries, { [key]: schema });
		} else {
			throw new Error(
				`attempted to change schema of entry "${key}", which doesn't exist in node "${this.category}-${this.name}"`,
			);
		}
	}

	public hasEntry(key: string) {
		return (
			(this.inputSchema && key in this.inputSchema.entries) ||
			(this.outputSchema && key in this.outputSchema.entries)
		);
	}

	public entry(
		key: string,
		unwrap = false,
	): {
		source: "input" | "output";
		type: string;
		generic: boolean;
		schema: ObjectEntry;
	} {
		if (this.inputSchema && key in this.inputSchema.entries) {
			const rawSchema = this.inputSchema.entries[key];
			const typeData = this.type(key, rawSchema);
			return {
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
		generic: boolean;
	} {
		if (Object.values(this.genericProperties).some((x) => x.includes(key))) {
			return {
				// biome-ignore lint/style/noNonNullAssertion: checked above
				type: Object.entries(this.genericProperties).find((x) =>
					x[1].includes(key),
				)![0],
				generic: true,
			};
		}

		const unwrapped = unwrapNodeIfNeeded(schema);
		return {
			type: isArray(unwrapped)
				? `Array<${unwrapNodeIfNeeded(unwrapped.item).expects}>`
				: unwrapped.expects,
			generic: false,
		};
	}
}
