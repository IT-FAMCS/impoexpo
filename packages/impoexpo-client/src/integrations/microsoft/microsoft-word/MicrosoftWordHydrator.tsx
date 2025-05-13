import { useLingui } from "@lingui/react/macro";
import {
	MicrosoftWordHydratorState,
	useMicrosoftWordHydratorStore,
} from "./store";
import FileDropzone from "@/components/modals/FileDropzone";

export function MicrosoftWordHydrator(props: { callback: () => void }) {
	const { state } = useMicrosoftWordHydratorStore();
	switch (state) {
		case MicrosoftWordHydratorState.UPLOAD:
			return <MicrosoftWordUploader />;
		case MicrosoftWordHydratorState.EXTRACT:
			return <>EXTRACT</>;
		case MicrosoftWordHydratorState.VERIFY:
			return <>VERIFY</>;
	}
}

export function MicrosoftWordUploader() {
	const { t } = useLingui();
	const { setState } = useMicrosoftWordHydratorStore();

	return <FileDropzone />;
}
