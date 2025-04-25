import type { ProjectIntegration } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { MessageDescriptor } from "@lingui/core";

export type Integration = {
	id: string;
	title: MessageDescriptor;
	icon: React.ReactNode;
	read: boolean;
	write: boolean;

	getProjectInformation?: () => Promise<ProjectIntegration>;
	onProjectInformationLoaded?: (data: ProjectIntegration) => Promise<void>;

	checkAuthenticated: () => Promise<boolean>;
	verifier: (
		successCallback: () => void,
		resetCallback: () => void,
	) => React.ReactNode;
	authenticator: (callback: () => void) => React.ReactNode;
	hydrator: (callback: () => void) => React.ReactNode;
	selectedItemsRenderer: () => React.ReactNode[];
};
