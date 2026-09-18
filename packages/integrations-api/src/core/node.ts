import * as v from "valibot";

export interface NodeBase {
	readonly name: string;
	readonly brand: string;
}

export class StaticNode<
	TIn extends v.ObjectEntries = Record<string, never>,
	TOut extends v.ObjectEntries = Record<string, never>,
	TInMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TOutMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
> implements NodeBase {
	name: string;
	brand: string = "static";

	input?: v.ObjectSchema<TIn, TInMessages> = undefined;
	output?: v.ObjectSchema<TOut, TOutMessages> = undefined;

	constructor(
		_name: string,
		_input: v.ObjectSchema<TIn, TInMessages> | undefined,
		_output: v.ObjectSchema<TOut, TOutMessages> | undefined,
	) {
		this.name = _name;
		this.input = _input;
		this.output = _output;
	}
}

export const staticNode = <
	TInMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TOutMessages extends v.ErrorMessage<v.ObjectIssue> | undefined = undefined,
	TIn extends v.ObjectEntries = Record<string, never>,
	TOut extends v.ObjectEntries = Record<string, never>,
>(
	name: string,
	input?: v.ObjectSchema<TIn, TInMessages>,
	output?: v.ObjectSchema<TOut, TOutMessages>,
) => new StaticNode<TIn, TOut, TInMessages, TOutMessages>(name, input, output);
