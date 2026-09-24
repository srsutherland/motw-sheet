import { inject, provide, toRef } from 'vue';

// Components get "their" hunter from the nearest ancestor that provides one,
// instead of it being passed down as a prop at every level.

const hunterKey = Symbol('hunter');

// Accepts a ref, a getter, or a plain hunter.
const provideHunter = (hunter) => {
    provide(hunterKey, toRef(hunter));
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

export { provideHunter, useHunter };
