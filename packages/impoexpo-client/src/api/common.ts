export const BACKEND_URL_BASE = import.meta.env.VITE_BACKEND_URL;

export const route = (path: string, query?: Record<string, string>) => {
	const current = new URL(`${BACKEND_URL_BASE}${path}`);
	current.search = new URLSearchParams(query).toString();
	return current;
};
