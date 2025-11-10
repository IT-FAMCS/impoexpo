export class RatelimitHitError extends Error {
	public policyLimit?: number;
	public policySeconds?: number;
	public resetSeconds: number;

	constructor(response: Response) {
		super(`ratelimit hit on ${response.url}`);
		this.name = "RatelimitHitError";
		Object.setPrototypeOf(this, RatelimitHitError.prototype);

		if (!response.headers.has("RateLimit-Reset"))
			throw new Error(
				"RatelimitHitError expected to have the RateLimit-Reset header in the response",
			);
		this.resetSeconds = Number.parseInt(
			// biome-ignore lint/style/noNonNullAssertion: already checked before
			response.headers.get("Ratelimit-Reset")!,
			10,
		);

		if (response.headers.has("RateLimit-Policy")) {
			// this is probably a horrible way of doing this but whatever
			// example header: 10;w=3600
			// biome-ignore lint/style/noNonNullAssertion: guaranteed to not be null
			const split = response.headers.get("Ratelimit-Policy")!.split(";w=");
			if (split.length !== 2)
				throw new Error(
					"RatelimitHitError found an unexpected amount of variables in the RateLimit-Policy header",
				);
			this.policyLimit = Number.parseInt(split[0], 10);
			this.policySeconds = Number.parseInt(split[1], 10);
		}
	}
}
