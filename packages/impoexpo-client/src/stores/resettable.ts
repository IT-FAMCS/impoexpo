import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { create as actualCreate } from "zustand";

export const WIZARD_STORE_CATEGORY = "wizard";

const storeResetFunctions: Map<string, Set<() => void>> = new Map();
export const resetStores = (...categories: string[]) => {
	for (const category of categories) {
		if (!storeResetFunctions.has(category)) {
			console.warn(`unknown resettable store category: ${category}. ignoring`);
			continue;
		}

		console.info(`resetting all stores in the "${category}" category`);
		// biome-ignore lint/style/noNonNullAssertion: checked with .has() beforehand
		for (const fn of storeResetFunctions.get(category)!) {
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
			if (!storeResetFunctions.has(category))
				storeResetFunctions.set(category, new Set());
			storeResetFunctions.get(category)?.add(() => {
				store.setState(initialState, true);
			});
		}

		return store;
	};
};
