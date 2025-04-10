import type * as v from "valibot";

export type AllowedObjectEntry =
	| v.GenericSchema
	| v.SchemaWithFallback<v.GenericSchema, unknown>
	| v.ExactOptionalSchema<v.GenericSchema, unknown>
	| v.NullishSchema<v.GenericSchema, unknown>
	| v.OptionalSchema<v.GenericSchema, unknown>;

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

	public relatedProperties?: (keyof (TIn & TOut))[][] = undefined;

	constructor(
		init: Partial<BaseNode<TIn, TOut>> &
			Pick<BaseNode<TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
	}
}
