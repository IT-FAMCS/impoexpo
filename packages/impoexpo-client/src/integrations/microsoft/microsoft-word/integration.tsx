import { registerIntegration } from "@/integrations/integrations";
import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import { MicrosoftWordHydrator } from "./MicrosoftWordHydrator";
import { useMicrosoftWordHydratorStore } from "./store";
import { Trans } from "@lingui/react/macro";
import {
	MicrosoftWordProjectIntegrationSchema,
	type MicrosoftWordProjectIntegration,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordProjectIntegrationSchema";
import * as v from "valibot";
import { getFile } from "@/db/files";
import { registerMicrosoftWordNode } from "./nodes";

registerIntegration({
	id: "microsoft-word",
	title: msg`Microsoft Word`,
	icon: <Icon icon="mdi:microsoft-word" />,
	read: false,
	write: true,

	async getProjectInformation() {
		const documents = useMicrosoftWordHydratorStore.getState().documents;
		return {
			data: {
				documents: documents
					.filter((d) => d.layout)
					.map((d) => ({
						clientIdentifier: d.id,
						// biome-ignore lint/style/noNonNullAssertion: filtered out
						layout: d.layout!,
					})),
			},
		} satisfies MicrosoftWordProjectIntegration;
	},

	async onProjectInformationLoaded(data) {
		if (!v.is(MicrosoftWordProjectIntegrationSchema, data)) return;
		for (const document of data.data.documents) {
			const file = await getFile(document.clientIdentifier);
			if (!file || !file.filename) continue;
			useMicrosoftWordHydratorStore.getState().addDocument({
				id: document.clientIdentifier,
				file: new File([file.data], file.filename, { type: file.mimeType }),
				layout: document.layout,
			});
			registerMicrosoftWordNode(file.filename, document.layout);
		}
	},

	hydrator: (callback) => <MicrosoftWordHydrator callback={callback} />,
	selectedItemsRenderer: () =>
		useMicrosoftWordHydratorStore.getState().documents.map((d) => ({
			className: "p-2",
			startContent: <Icon width={24} icon="mdi:microsoft-word" />,
			title: d.file.name,
			description: <Trans>Microsoft Word</Trans>,
			key: d.file.name,
		})),
});
