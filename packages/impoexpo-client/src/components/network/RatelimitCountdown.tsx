import { useEffect, useMemo, useState } from "react";
import { useCountdown } from "usehooks-ts";
import NumberFlow, { NumberFlowGroup, continuous } from "@number-flow/react";
import { Code } from "@heroui/react";

export default function RatelimitCountdown(props: {
	resetSeconds: number;
	retry: () => void;
}) {
	const [count, { startCountdown }] = useCountdown({
		countStart: props.resetSeconds,
		intervalMs: 1000,
	});

	const hh = useMemo(() => Math.floor(count / 3600), [count]);
	const mm = useMemo(() => Math.floor((count % 3600) / 60), [count]);
	const ss = useMemo(() => count % 60, [count]);

	useEffect(startCountdown, []);
	useEffect(() => {
		if (count === 0) props.retry();
	}, [count, props.retry]);

	return (
		<NumberFlowGroup>
			<Code
				style={
					{
						fontVariantNumeric: "tabular-nums",
						"--number-flow-char-height": "0.8em",
					} as React.CSSProperties
				}
				className="flex items-baseline overflow-hidden font-mono text-3xl font-semibold"
			>
				<NumberFlow
					plugins={[continuous]}
					trend={-1}
					value={hh}
					format={{ minimumIntegerDigits: 2 }}
				/>
				<NumberFlow
					prefix=":"
					trend={-1}
					value={mm}
					digits={{ 1: { max: 5 } }}
					format={{ minimumIntegerDigits: 2 }}
				/>
				<NumberFlow
					prefix=":"
					trend={-1}
					value={ss}
					digits={{ 1: { max: 5 } }}
					format={{ minimumIntegerDigits: 2 }}
				/>
			</Code>
		</NumberFlowGroup>
	);
}
