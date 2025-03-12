import Database from "better-sqlite3";
import { childLogger } from "./logger";
import { map } from "extra-promise";
import { findMigrationFilenames, readMigrationFile } from "migration-files";
import { migrate } from "@blackglory/better-sqlite3-migrations";

const logger = childLogger("db");
export const db = new Database("data.db", {
	verbose: (message, ...args) => logger.debug(message as string, ...args),
});
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

process.on("exit", () => db.close());
logger.info(`database connected to ${db.name}`);

(async () => {
	try {
		const filenames = await findMigrationFilenames("./src/migrations");
		const migrations = await map(filenames, readMigrationFile);
		logger.info(`found ${migrations.length} potential migration(s)`);
		migrate(db, migrations);
	} catch (err) {
		logger.error(`failed to apply database migrations: ${err}`);
	}
})();
