import { cn } from "@heroui/theme";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface AnimateChangeInSizeProps {
	children: React.ReactNode;
	className?: string;
	width?: boolean;
	height?: boolean;
}

// width is broken and will probably forever be broken
export default function AnimateChangeInSize(props: AnimateChangeInSizeProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [width, setWidth] = useState<number | "auto">("auto");
	const [height, setHeight] = useState<number | "auto">("auto");

	useEffect(() => {
		if (containerRef.current) {
			const resizeObserver = new ResizeObserver((entries) => {
				// We only have one entry, so we can use entries[0].
				const observedHeight = entries[0].contentRect.height;
				const observedWidth = entries[0].contentRect.width;
				if (props.height ?? false) setHeight(observedHeight);
				if (props.width ?? false) setWidth(observedWidth);
			});

			resizeObserver.observe(containerRef.current);

			return () => {
				// Cleanup the observer when the component is unmounted
				resizeObserver.disconnect();
			};
		}
	}, [props.width, props.height]);

	return (
		<motion.div
			className={cn(props.className, "overflow-hidden")}
			style={{ height }}
			animate={{ height }}
		>
			<div ref={containerRef}>{props.children}</div>
		</motion.div>
	);
}
