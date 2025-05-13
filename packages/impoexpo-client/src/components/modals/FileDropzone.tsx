import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Trans } from "@lingui/react/macro";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function FileDropzone() {
	const onDrop = useCallback((acceptedFiles: File[]) => {
		console.log(acceptedFiles);
	}, []);

	const { getRootProps, getInputProps, isDragAccept, isDragReject } =
		useDropzone({ onDrop });

	return (
		// @ts-ignore
		<Card
			shadow="none"
			isPressable
			{...getRootProps()}
			className={`border-2 border-dashed !transition-all duration-500 ease-in-out ${isDragAccept ? "border-success" : isDragReject ? "border-danger" : "border-default"}`}
		>
			<input {...getInputProps()} />
			<CardBody>
				<div className="flex flex-col items-center justify-center gap-2 aspect-square">
					<Icon width={48} icon="mdi:tray-upload" />
					<Trans>drag and drop a file here or click</Trans>
				</div>
			</CardBody>
		</Card>
	);
}
