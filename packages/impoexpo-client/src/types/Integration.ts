import type { MessageDescriptor } from "@lingui/core";

export type Integration = {
	id: string;
	title: MessageDescriptor;
	icon: React.ReactNode;
	read: boolean;
	write: boolean;

	getPersistentInformation?: (
		prev?: Record<string, unknown>,
	) => Record<string, unknown>;
	onPersistentInformationLoaded?: (data: Record<string, unknown>) => void;

	checkAuthenticated: () => Promise<boolean>;
	verificator: (
		successCallback: () => void,
		resetCallback: () => void,
	) => React.ReactNode;
	authenticator: (callback: () => void) => React.ReactNode;
	hydrator: (callback: () => void) => React.ReactNode;
	selectedItemsRenderer: () => React.ReactNode[];
};
