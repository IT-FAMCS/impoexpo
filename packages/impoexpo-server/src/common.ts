import apicache from "apicache";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { type Duration, parseDuration } from "./helpers/unit-converter";

export const defaultCache = apicache.options({
	respectCacheControl: true,
}).middleware;
export const cacheOnlyIfSuccessful = (req: Request, res: Response) =>
	res.statusCode === 200;

export const defaultRatelimiter = (window: Duration, limit: number) =>
	rateLimit({
		windowMs: parseDuration(window),
		limit: limit,
		standardHeaders: true,
		legacyHeaders: false,
		skipFailedRequests: true,
		skip: (req, res) => req.headers["cache-control"] !== "no-cache", // do not count cached requests into the ratelimit
		handler: (req, res, next, options) => {
			res
				.status(options.statusCode)
				.set("Access-Control-Expose-Headers", [
					"RateLimit-Policy",
					"RateLimit-Reset",
				])
				.end();
		},
	});
