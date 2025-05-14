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

registerIntegration({
	id: "microsoft-word",
	title: msg`Microsoft Word`,
	icon: <Icon icon="mdi:microsoft-word" />,
	read: false,
	write: true,

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
