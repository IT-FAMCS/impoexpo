import type { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
