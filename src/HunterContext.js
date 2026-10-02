import { computed, inject, provide, toRef } from 'vue';
import { hunterState } from '@/HunterState';

// Components get "their" hunter from the nearest ancestor that provides one,
// instead of it being passed down as a prop at every level.

const hunterKey = Symbol('hunter');
const stateKey = Symbol('hunter state');

// Accepts a ref, a getter, or a plain hunter.
// Also provides the hunter's computed state (HunterState.js), shared by everything below.
const provideHunter = (hunter) => {
    const ref = toRef(hunter);
    provide(hunterKey, ref);
    provide(stateKey, computed(() => (ref.value ? hunterState(ref.value) : null)));
};

// Returns a ref to the hunter: `hunter.value` in script, plain `hunter` in templates.
// In script, read `hunter.value` inside each function (`const h = hunter.value;`),
// never once at setup: the provider can swap hunters while the component stays mounted.
const useHunter = () => {
    const hunter = inject(hunterKey, null);
    if (!hunter) {
        throw new Error('useHunter() needs an ancestor that calls provideHunter()');
    }
    return hunter;
};

// A computed ref to the hunter's state: moves, features, gear, ratings, picks...
// Same rule as useHunter: read `.value` where it's used.
const useHunterState = () => {
    const state = inject(stateKey, null);
    if (!state) {
        throw new Error('useHunterState() needs an ancestor that calls provideHunter()');
    }
    return state;
};

export { provideHunter, useHunter, useHunterState };
