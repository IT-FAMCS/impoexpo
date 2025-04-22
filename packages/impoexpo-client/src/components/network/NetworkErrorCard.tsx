import { RatelimitHitError } from "@/api/errors";
import { Button, Code } from "@heroui/react";
import { Icon } from "@iconify/react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import RatelimitCountdown from "./RatelimitCountdown";

export default function NetworkErrorCard(props: {
	title: string;
	error: Error;
	retry: () => void;
	retryButtonText?: string;
}) {
	if (props.error instanceof RatelimitHitError) {
		return (
			<div className="flex flex-col items-center justify-center gap-1">
				<Icon className="text-danger" width={48} icon="mdi:error-outline" />
				<p className="text-center">
					<Trans>
						you're sending requests too often!
						<br />
						you can try again in:
					</Trans>
				</p>
				<RatelimitCountdown
					retry={props.retry}
					resetSeconds={props.error.resetSeconds}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-1">
			<Icon className="text-danger" width={48} icon="mdi:error-outline" />
			<p className="text-center">
				{props.title}
				<br />
				<Code>{props.error.message}</Code>
			</p>
			<Button onPress={props.retry} color="primary">
				{props.retryButtonText ?? t`retry`}
			</Button>
		</div>
	);
}
