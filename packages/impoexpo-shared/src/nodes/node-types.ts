import { type, type Type } from "arktype";

const defaultSchema = type("undefined");
export type DefaultSchemaType = typeof defaultSchema.infer;
export type AllowedSchemaType = Record<string, unknown> | undefined;

export class BaseNode<
	TName extends string,
	TCategory extends string,
	TIn extends AllowedSchemaType = DefaultSchemaType,
	TOut extends AllowedSchemaType = DefaultSchemaType,
> {
	public name!: TName;
	public category!: TCategory;

	public inputSchema!: Type<TIn>;
	public outputSchema!: Type<TOut>;

	constructor(
		init: Partial<BaseNode<TName, TCategory, TIn, TOut>> &
			Pick<BaseNode<TName, TCategory, TIn, TOut>, "name" | "category">,
	) {
		Object.assign(this, init);
		if (this.inputSchema === undefined)
			this.inputSchema = defaultSchema as Type<TIn>;
		if (this.outputSchema === undefined)
			this.outputSchema = defaultSchema as Type<TOut>;
	}
}
