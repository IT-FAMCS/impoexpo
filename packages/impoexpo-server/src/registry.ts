import type { Express } from "express";
import { glob } from "glob";
import path from "node:path";
import { childLogger, logger } from "./logger";

export type ServerIntegrationInitSuccess = {
	success: true;
};
export type ServerIntegrationInitFailure = {
	success: false;
	message: string;
	help?: string;
};
export type ServerIntegrationInit =
	| ServerIntegrationInitSuccess
	| ServerIntegrationInitFailure;

export type ServerIntegration = {
	init?: () => Promise<ServerIntegrationInit>;
	registerEndpoints?: (app: Express) => Promise<void>;
	dependencies?: string[];
};

const importedIntegrations: Record<string, ServerIntegration> = {};
const preparedIntegrations: Record<
	string,
	{ enabled: boolean; message?: string }
> = {};

export const importIntegrations = async () => {
	const logger = childLogger("integrations");
	logger.info("importing integrations");

	const entries = await glob("./**/*.ts", {
		cwd: path.join(import.meta.dirname, "integrations"),
		ignore: "*/common/**",
	});
	for (const entry of entries) {
		logger.info(`\t-> importing ${path.basename(entry)}`);
		await import(`./integrations/${entry.replace(".ts", "")}`);
	}
};

export const prepareIntegrations = async (app: Express) => {
	const logger = childLogger("integrations");
	logger.info("initializing integrations");

	const prepareIntegration = async (
		id: string,
		integration: ServerIntegration,
	): Promise<boolean> => {
		const result = integration.init
			? await integration.init()
			: ({ success: true } as ServerIntegrationInitSuccess);
		if (!result.success) {
			logger.error(`\t-> ${id}: failed (${result.message})`);
			if (result.help) logger.info(`\t\t-> help: ${result.help}`);

			preparedIntegrations[id] = { enabled: false, message: result.message };
			return false;
		}

		await integration.registerEndpoints?.(app);
		preparedIntegrations[id] = { enabled: true };

		logger.info(`\t-> ${id}: ok`);
		return true;
	};

	for (const [key, integration] of Object.entries(importedIntegrations)) {
		if (key in preparedIntegrations) continue;
		if (integration.dependencies) {
			let failedDependency: string | undefined;
			for (const dependency of integration.dependencies) {
				if (dependency in preparedIntegrations) continue;
				if (!(dependency in importedIntegrations))
					throw new Error(
						`invalid dependency "${dependency}" for integration "${key}" (it wasn't imported or found)`,
					);
				const failed = !(await prepareIntegration(
					dependency,
					importedIntegrations[dependency],
				));
				if (failed) {
					failedDependency = dependency;
					break;
				}
			}
			if (failedDependency) {
				logger.warn(
					`\t-> one of the dependencies ("${failedDependency}") failed, aborting "${key}"`,
				);
				preparedIntegrations[key] = {
					enabled: false,
					message: `one of the dependencies failed (${failedDependency})`,
				};
				continue;
			}
		}
		await prepareIntegration(key, integration);
	}
};

export const registerIntegration = (
	settings: {
		id: string;
	} & ServerIntegration,
) => {
	if (settings.id in importedIntegrations)
		throw new Error(
			`integration with id "${settings.id}" has already been registered`,
		);
	importedIntegrations[settings.id] = settings as ServerIntegration;
};
