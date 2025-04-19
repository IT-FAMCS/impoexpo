import type { Integration } from "@/types/Integration";

export const registerIntegration = (integration: Integration) => {
	if (allIntegrations.findIndex((i) => i.id === integration.id) === -1)
		allIntegrations.push(integration);
};
export const allIntegrations: Integration[] = [];
export const readIntegrations = () => allIntegrations.filter((i) => i.read);
export const writeIntegrations = () => allIntegrations.filter((i) => i.write);
