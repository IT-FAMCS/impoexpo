import type { Express } from "express";
import { logger } from "../logger";
import { createSession } from "better-sse";

export const registerProjectEndpoints = (app: Express) => {
	logger.info("\t-> registering project endpoints");

	app.post("/project/upload", async (req, res) => {});

	/* app.get("/project/status", async (req, res) => {
        const session = await createSession(req, res);
    }); */
};
