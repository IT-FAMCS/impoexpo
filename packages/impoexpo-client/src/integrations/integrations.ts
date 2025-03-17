import type { Integration } from "@/types/Integration";
import { GoogleFormsIntegration } from "./google/google-forms/GoogleFormsIntegration";
import { ConsoleIntegration } from "./console/ConsoleIntegration";

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
