export type Integration = {
	id: string;
	title: string;
	icon: React.ReactNode;
	read: boolean;
	write: boolean;
	checkAuthenticated: () => Promise<boolean>;
	authenticator: () => React.ReactNode;
};
