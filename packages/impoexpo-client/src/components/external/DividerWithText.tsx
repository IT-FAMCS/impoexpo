import { Divider } from "@heroui/react";
import type { ReactNode } from "react";

export default function DividerWithText(props: { children?: ReactNode }) {
	return (
		<div className="flex flex-row items-center w-full gap-2">
			<p className="text-foreground-500">{props.children}</p>
			<Divider className="flex-grow w-max" />
		</div>
	);
}
