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
import { Spinner } from "@heroui/react";
import NetworkErrorCard from "@/components/network/NetworkErrorCard";

export function MicrosoftWordHydrator(props: { callback: () => void }) {
	const { state } = useMicrosoftWordHydratorStore();
	switch (state) {
		case MicrosoftWordHydratorState.UPLOAD:
			return <MicrosoftWordUploader />;
		case MicrosoftWordHydratorState.LAYOUT:
			return <MicrosoftWordLayouter />;
		case MicrosoftWordHydratorState.VERIFY:
			return <>VERIFY</>;
	}
}

export function MicrosoftWordLayouter() {
	const { t } = useLingui();
	const { setState, currentDocument } = useMicrosoftWordHydratorStore();

	if (!currentDocument)
		throw new Error(
			"attempted to render MicrosoftWordLayouter without initializing currentDocument",
		);

	const { isFetching, isError, data, error } = useQuery({
		queryKey: ["get-microsoft-word-layout", currentDocument.lastModified],
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const form = new FormData();
			form.append("file", currentDocument);
			return await postFormWithResult(
				MICROSOFT_OFFICE_LAYOUT_ROUTE,
				form,
				MicrosoftOfficeDocumentLayoutSchema,
			);
		},
	});

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

	return <>{JSON.stringify(data)}</>;
}

export function MicrosoftWordUploader() {
	const { t } = useLingui();
	const { setState, setCurrentDocument } = useMicrosoftWordHydratorStore();

	useEffect(() => setCurrentDocument(undefined), [setCurrentDocument]);
	return (
		<FileDropzone
			options={{
				accept: {
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
						[".docx"],
				},
				onDropAccepted(files) {
					setCurrentDocument(files[0]);
					setState(MicrosoftWordHydratorState.LAYOUT);
				},
			}}
		/>
	);
}
