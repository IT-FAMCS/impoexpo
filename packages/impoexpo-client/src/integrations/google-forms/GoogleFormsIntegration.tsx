import type { Integration } from "@/types/Integration";
import { Icon } from "@iconify/react/dist/iconify.js";

export const GoogleFormsIntegration: Integration = {
	id: "google-forms",
	title: "Google Forms",
	icon: <Icon icon="simple-icons:googleforms" />,
	read: true,
	write: false,
	checkAuthenticated: () =>
		new Promise<boolean>((resolve, reject) => {
			if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
				reject(
					new Error(
						"couldn't locate google client ID in environment variables",
					),
				);
			}

			resolve(false);
		}),
	authenticator: () => <></>,
};
