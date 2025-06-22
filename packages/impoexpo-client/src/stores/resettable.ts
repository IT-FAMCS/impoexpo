import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { create as actualCreate } from "zustand";

export const WIZARD_STORE_CATEGORY = "wizard";

const storeResetFunctions: Record<string, (() => void)[]> = {};
export const resetStores = (...categories: string[]) => {
	for (const category of categories) {
		if (!(category in storeResetFunctions)) {
			console.warn(`unknown resettable store category: ${category}. ignoring`);
			continue;
		}

		console.info(`resetting all stores in the "${category}" category`);
		for (const fn of storeResetFunctions[category] || []) {
			fn();
		}
	}
};

export const createResettable = <T>(...categories: string[]) => {
	return <Mos extends [StoreMutatorIdentifier, unknown][]>(
		stateCreator: StateCreator<T, [], Mos>,
	) => {
		const store = actualCreate(stateCreator);
		const initialState = store.getInitialState();

		for (const category of categories) {
			if (!(category in storeResetFunctions))
				storeResetFunctions[category] = [];
			storeResetFunctions[category] = [
				...storeResetFunctions[category],
				() => {
					store.setState(initialState, true);
				},
			];
		}

		return store;
	};
};
