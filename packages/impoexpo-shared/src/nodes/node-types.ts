import type * as v from "valibot";
import { unwrapNodeIfNeeded } from "./node-utils";

export type AllowedObjectEntry =
	| v.GenericSchema
	| v.SchemaWithFallback<v.GenericSchema, unknown>
	| v.ExactOptionalSchema<v.GenericSchema, unknown>
	| v.NullishSchema<v.GenericSchema, unknown>
	| v.OptionalSchema<v.GenericSchema, unknown>;

export type NodePropertyOptions<TProperty extends AllowedObjectEntry> =
	TProperty extends v.OptionalSchema<
		infer TWrappedSchema extends AllowedObjectEntry,
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

	public entry(
		key: string,
		unwrap = false,
	): {
		source: "input" | "output";
		schema: AllowedObjectEntry;
	} {
		if (this.inputSchema && key in this.inputSchema.entries) {
			const rawSchema = this.inputSchema.entries[key];
			return {
				source: "input",
				schema: unwrap ? unwrapNodeIfNeeded(rawSchema) : rawSchema,
			};
		}
		if (this.outputSchema && key in this.outputSchema.entries) {
			const rawSchema = this.outputSchema.entries[key];
			return {
				source: "output",
				schema: unwrap ? unwrapNodeIfNeeded(rawSchema) : rawSchema,
			};
		}
		throw new Error(
			`couldn't pick entry "${key}" in node with type "${this.category}-${this.name}"`,
		);
	}
}
