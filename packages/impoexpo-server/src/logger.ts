import { pino } from "pino";
import { pinoHttp } from "pino-http";

// TODO: determine log level from .env
const logger = pino({
	name: "root",
	level: "debug",
	transport: {
		targets: [
			{
				target: "pino-pretty",
				options: {
					colorize: true,
					ignore: "hostname,pid,reqId,responseTime,req,res",
				},
				level: "debug",
			},
			{
				target: "pino-pretty",
				options: {
					colorize: false,
					destination: "logs/latest-pretty.log",
					append: false,
					mkdir: true,
					ignore: "hostname,pid,reqId,responseTime,req,res",
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
const httpLogger = pinoHttp({
	logger: childLogger("http"),
	quietReqLogger: true,
	quietResLogger: true,
	customSuccessMessage(req, res, responseTime) {
		return `${req.method} ${req.url} -> ${res.statusCode} (${responseTime}ms)`;
	},
});

export { logger, httpLogger, childLogger };
