import type * as v from "valibot";

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

	public genericProperties?: Record<string, (keyof (TIn & TOut))[]> = undefined;

	constructor(
		init: Partial<BaseNode<TIn, TOut>> &
			Pick<BaseNode<TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
	}
}
