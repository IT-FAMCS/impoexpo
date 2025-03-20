// this is probably some of the worst typescript code i have ever written
import type * as v from "valibot";

export type AllowedObjectEntry =
	| v.GenericSchema
	| v.SchemaWithFallback<v.GenericSchema, unknown>
	| v.ExactOptionalSchema<v.GenericSchema, unknown>
	| v.NullishSchema<v.GenericSchema, unknown>
	| v.OptionalSchema<v.GenericSchema, unknown>;

export class BaseNode<
	TName extends string,
	TCategory extends string,
	TIn extends v.ObjectEntries = Record<string, AllowedObjectEntry>,
	TOut extends v.ObjectEntries = Record<string, AllowedObjectEntry>,
	TInMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TOutMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
> {
	public name!: TName;
	public category!: TCategory;

	public inputSchema?: v.ObjectSchema<TIn, TInMessages> = undefined;
	public outputSchema?: v.ObjectSchema<TOut, TOutMessages> = undefined;

	constructor(
		init: Partial<BaseNode<TName, TCategory, TIn, TOut>> &
			Pick<BaseNode<TName, TCategory, TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
	}
}
