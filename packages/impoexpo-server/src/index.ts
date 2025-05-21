import "dotenv/config";
import express from "express";
import compression from "compression";
import { httpLogger, logger } from "./logger";
import cors from "cors";
import { loadOrCreateKey } from "./helpers/crypto-utils";
import { prepareNodes } from "./engine/node-executor-utils";
import { importIntegrations, prepareIntegrations } from "./registry";
import { registerProjectEndpoints } from "./project/endpoints";

if (!process.env.PORT) {
	logger.error("couldn't find PORT in .env, exiting");
	process.exit(1);
}
await loadOrCreateKey();

const app = express();
app.use(express.json());
app.use(compression());
app.use(httpLogger);
app.use(cors());
app.disable("x-powered-by");

// nodes
await prepareNodes();

// integrations
try {
	await importIntegrations();
	await prepareIntegrations(app);
} catch (err) {
	logger.error(`failed to initialize integrations: ${err}`);
	process.exit(1);
}

// misc
await registerProjectEndpoints(app);

app.listen(process.env.PORT, () => {
	logger.info(`server started listening on port ${process.env.PORT}`);
});
