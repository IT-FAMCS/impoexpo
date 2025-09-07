import { Divider } from "@heroui/react";
import type { ReactNode } from "react";

export default function DividerWithText(props: { children?: ReactNode }) {
	return (
		<div className="flex flex-row gap-2 items-center w-full">
			<p className="text-foreground-500">{props.children}</p>
			<Divider className="flex-grow w-max" />
		</div>
	);
}
