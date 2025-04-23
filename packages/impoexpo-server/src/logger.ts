import { pino } from "pino";

// TODO: determine log level from .env
const logger = pino({
	name: "root",
	level: "debug",
	transport: {
		targets: [
			{ target: "pino-pretty", options: { colorize: true }, level: "debug" },
			{
				target: "pino-pretty",
				options: {
					colorize: false,
					destination: "logs/latest-pretty.log",
					append: false,
					mkdir: true,
				},
				level: "debug",
			},
			{
				target: "pino/file",
				options: {
					destination: "logs/latest.log",
					append: false,
					mkdir: true,
					level: "debug",
				},
			},
		],
	},
});

const childLogger = (name: string) => logger.child({ name: name });
export { logger, childLogger };
