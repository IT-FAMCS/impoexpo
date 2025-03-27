import type { Integration } from "@/types/Integration";
import { ConsoleIntegration } from "./console/ConsoleIntegration";
import { GoogleFormsIntegration } from "./google/google-forms/GoogleFormsIntegration";

export const allIntegrations: Integration[] = [
	GoogleFormsIntegration,
	ConsoleIntegration,
];
export const readIntegrations: Integration[] = allIntegrations.filter(
	(i) => i.read,
);
export const writeIntegrations: Integration[] = allIntegrations.filter(
	(i) => i.write,
);
