import { Trans, useLingui } from "@lingui/react/macro";
import {
	MicrosoftWordHydratorState,
	useMicrosoftWordHydratorStore,
} from "./store";
import FileDropzone from "@/components/modals/FileDropzone";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { postFormWithResult } from "@/api/common";
import { MICROSOFT_OFFICE_LAYOUT_ROUTE } from "@impoexpo/shared/schemas/integrations/microsoft/endpoints";
import { MicrosoftOfficeDocumentLayoutSchema } from "@impoexpo/shared/schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import { Button, Listbox, ListboxItem, Spinner } from "@heroui/react";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";
import { Icon } from "@iconify/react";
import { saveFile } from "@/db/files";
import { registerMicrosoftWordNode } from "./nodes";

export function MicrosoftWordHydrator(props: { callback: () => void }) {
	const { state } = useMicrosoftWordHydratorStore();
	switch (state) {
		case MicrosoftWordHydratorState.UPLOAD:
			return <MicrosoftWordUploader />;
		case MicrosoftWordHydratorState.LAYOUT:
			return <MicrosoftWordLayouter />;
		case MicrosoftWordHydratorState.VERIFY:
			return <MicrosoftWordVerifier callback={props.callback} />;
	}
}

export function MicrosoftWordVerifier(props: { callback: () => void }) {
	const { currentDocument, setCurrentDocument, setState, addDocument } =
		useMicrosoftWordHydratorStore();
	if (!currentDocument?.layout)
		throw new Error(
			"attempted to render MicrosoftWordVerifier without currentDocument.layout initialized",
		);

	const getIconFromType = (type: string, width: number) => {
		switch (type) {
			case "string": {
				return <Icon width={width} icon="mdi:text" />;
			}
			case "number": {
				return <Icon width={width} icon="mdi:123" />;
			}
			default: {
				return <Icon width={width} icon="mdi:selection" />;
			}
		}
	};

	if (currentDocument.layout.placeholders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<p className="text-center">
					<Trans>
						no placeholder were found in the document.
						<br />
						please check the document and try uploading it again.
					</Trans>
				</p>
				<Button
					startContent={<Icon width={18} icon="mdi:arrow-left" />}
					onPress={() => setState(MicrosoftWordHydratorState.UPLOAD)}
				>
					<Trans>go back to file upload</Trans>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<Trans>the following placeholders were found:</Trans>
			<Listbox
				selectionMode="none"
				className="border-small rounded-small border-default"
			>
				{currentDocument.layout.placeholders.map((p) => (
					<ListboxItem
						className="p-2"
						startContent={getIconFromType(p.type, 24)}
						key={p.originalName}
						description={p.description}
						classNames={{ title: "ml-1", description: "ml-1" }}
					>
						<p>
							{p.formattedName}{" "}
							<span className="text-foreground-500 text-tiny">({p.type})</span>
						</p>
					</ListboxItem>
				))}
			</Listbox>
			<Trans>is everything correct?</Trans>
			<div className="flex flex-row gap-2">
				<Button
					color="danger"
					startContent={<Icon width={18} icon="mdi:arrow-left" />}
					onPress={() => setState(MicrosoftWordHydratorState.UPLOAD)}
				>
					<Trans>no, go back to file upload</Trans>
				</Button>
				<Button
					color="success"
					endContent={<Icon width={18} icon="mdi:arrow-right" />}
					onPress={() => {
						addDocument(currentDocument);
						registerMicrosoftWordNode(
							currentDocument.file.name,
							// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist here
							currentDocument.layout!,
						);
						setCurrentDocument(undefined);
						setState(MicrosoftWordHydratorState.UPLOAD);
						props.callback();
					}}
				>
					<Trans>yes, proceed</Trans>
				</Button>
			</div>
		</div>
	);
}

export function MicrosoftWordLayouter() {
	const { t } = useLingui();
	const { setState, currentDocument } = useMicrosoftWordHydratorStore();

	if (!currentDocument)
		throw new Error(
			"attempted to render MicrosoftWordLayouter without initializing currentDocument",
		);

	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["get-microsoft-word-layout", currentDocument.file.lastModified],
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const form = new FormData();
			form.append("file", currentDocument.file);
			return await postFormWithResult(
				MICROSOFT_OFFICE_LAYOUT_ROUTE,
				form,
				MicrosoftOfficeDocumentLayoutSchema,
			);
		},
	});

	useEffect(() => {
		if (data) {
			currentDocument.layout = data;
			setState(MicrosoftWordHydratorState.VERIFY);
		}
	}, [data, currentDocument, setState]);

	if (isFetching) {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<Trans>extracting placeholders from the document</Trans>
				<Spinner />
			</div>
		);
	}

	if (isError) {
		return (
			<NetworkErrorCard
				title={t`couldn't extract placeholders from the document`}
				retry={() => setState(MicrosoftWordHydratorState.UPLOAD)}
				retryButtonText={t`back to file upload`}
				error={error}
			/>
		);
	}
}

export function MicrosoftWordUploader() {
	const { setState, setCurrentDocument } = useMicrosoftWordHydratorStore();

	useEffect(() => setCurrentDocument(undefined), [setCurrentDocument]);
	return (
		<FileDropzone
			options={{
				accept: {
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
						[".docx"],
				},
				async onDropAccepted(files) {
					const id = await saveFile(files[0]);
					setCurrentDocument({ file: files[0], id });
					setState(MicrosoftWordHydratorState.LAYOUT);
				},
			}}
		/>
	);
}
