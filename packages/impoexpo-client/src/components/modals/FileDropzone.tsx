import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { useDropzone, type DropzoneOptions } from "react-dropzone";

export default function FileDropzone(props: { options: DropzoneOptions }) {
	const {
		getRootProps,
		getInputProps,
		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone(props.options);

	return (
		<div className="flex flex-col gap-2">
			{/* @ts-ignore */}
			<Card
				shadow="none"
				isPressable
				{...getRootProps()}
				className={`border-2 border-dashed !transition-all duration-500 ease-in-out ${isDragActive ? (isDragAccept ? "border-success" : isDragReject ? "border-danger" : "border-default") : "border-default"}`}
			>
				<input {...getInputProps()} />
				<CardBody>
					<div className="flex flex-col items-center justify-center gap-2 aspect-square">
						<Icon width={48} icon="mdi:tray-upload" />
						<Trans>drag and drop a file here or click</Trans>
					</div>
				</CardBody>
			</Card>
			{props.options.accept && (
				<p className="text-foreground-500 text-sm italic">
					<Trans>
						will accept:&nbsp;
						{Object.values(props.options.accept)
							.flatMap((x) => `*${x}`)
							.join(", ")}
					</Trans>
				</p>
			)}
		</div>
	);
}
