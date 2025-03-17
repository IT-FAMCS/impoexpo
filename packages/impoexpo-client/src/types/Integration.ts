export type Integration = {
	id: string;
	title: string;
	icon: React.ReactNode;
	read: boolean;
	write: boolean;

	checkAuthenticated: () => Promise<boolean>;
	verificator: (
		successCallback: () => void,
		resetCallback: () => void,
	) => React.ReactNode;
	authenticator: (callback: () => void) => React.ReactNode;
	hydrator: (callback: () => void) => React.ReactNode;
	selectedItemsRenderer: () => React.ReactNode[];
};
