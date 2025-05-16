import "dotenv/config";
import express from "express";
import compression from "compression";
import { httpLogger, logger } from "./logger";
import cors from "cors";
import { registerGoogleEndpoints } from "./integrations/google/endpoints";
import { loadOrCreateKey } from "./helpers/crypto-utils";
import { registerProjectEndpoints } from "./project/endpoints";
import { prepareNodes } from "./engine/node-executor-utils";
import { registerMicrosoftEndpoints } from "./integrations/microsoft/endpoints";

if (!process.env.PORT) {
	logger.error("couldn't find PORT in .env, exiting");
	process.exit(1);
}
await loadOrCreateKey();
await prepareNodes();

const app = express();
app.use(express.json());
app.use(compression());
app.use(httpLogger);
app.use(cors());
app.disable("x-powered-by");

try {
	logger.info("registering endpoints");
	registerProjectEndpoints(app);
	registerGoogleEndpoints(app);
	registerMicrosoftEndpoints(app);
} catch (err) {
	logger.error(`failed to register endpoints: ${err}`);
	process.exit(1);
}

app.listen(process.env.PORT, () => {
	logger.info(`server started listening on port ${process.env.PORT}`);
});
