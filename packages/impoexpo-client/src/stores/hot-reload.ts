import type { UseBoundStore } from "zustand";

export const persistStoreOnReload = (
	name: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	useStore: UseBoundStore<any>,
) => {
	if (import.meta.hot) {
		const state = import.meta.hot?.data[name];
		if (state) {
			useStore.setState(import.meta.hot?.data[name]);
		}

		// biome-ignore lint/suspicious/noExplicitAny: meow
		useStore.subscribe((state: any) => {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			import.meta.hot!.data[name] = state;
		});
		import.meta.hot?.accept((newModule) => {
			if (newModule) {
				useStore.setState(import.meta.hot?.data[name]);
			}
		});
	}
};
