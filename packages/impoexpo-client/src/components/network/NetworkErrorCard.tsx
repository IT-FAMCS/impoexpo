import { RatelimitHitError } from "@/api/errors";
import { Button, Code } from "@heroui/react";
import { Icon } from "@iconify/react";
import RatelimitCountdown from "./RatelimitCountdown";

export default function NetworkErrorCard(props: {
	title: string;
	error: Error;
	retry: () => void;
}) {
	if (props.error instanceof RatelimitHitError) {
		return (
			<div className="flex flex-col gap-1 justify-center items-center">
				<Icon className="text-danger" width={48} icon="mdi:error-outline" />
				<p className="text-center">
					вы слишком часто отправляете запросы!
					<br />
					попробовать снова можно будет через:
				</p>
				<RatelimitCountdown
					retry={props.retry}
					resetSeconds={props.error.resetSeconds}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 justify-center items-center">
			<Icon className="text-danger" width={48} icon="mdi:error-outline" />
			<p className="text-center">
				{props.title}
				<br />
				<Code>{props.error.message}</Code>
			</p>
			<Button onPress={props.retry} color="primary">
				попробовать снова
			</Button>
		</div>
	);
}
