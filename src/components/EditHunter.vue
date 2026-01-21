<template>
    <h1 class="hunter-name">
        <input v-model="hunter.name" placeholder="Name"/>
        {{ hunter?.playbook_name }}
    </h1>

    <!-- Ratings Selection -->
    <section id="edit-ratings">
        <fieldset>
            <legend>Ratings, pick one:</legend>
            <div v-for="rating in hunter.playbook.ratings" :key="rating">
                <label>
                    <input
                        type="radio"
                        :value="rating"
                        v-model="hunter.ratings"
                    />
                    <span v-html="fomatRatingRich(rating)"></span>
                </label>
            </div>
        </fieldset>
    </section>

    <!-- Moves Section -->
    <section>
        <fieldset>
            <legend>Moves</legend>
            <div v-if="hunter?.moves?.length">
                <ul>
                    <li v-for="(move, i) in hunter.moves" :key="i">{{ move.name }}</li>
                </ul>
            </div>
            <button>Add Move</button>
            <button @click="addAllMoves">
                Add ALL ({{ hunter.playbook.moves.children.options.length }}) Moves
            </button>
        </fieldset>
    </section>

    <!-- Special (Playbook-Specific) Section -->
    <section>
        <fieldset>
            <legend>Playbook-Specific</legend>
            <p>WIP: Additional sections for {{ hunter.playbook_name }}.</p>
        </fieldset>
    </section>

    <!-- Gear Section -->
    <section id="gear">
        <fieldset>
            <legend>Starter Gear, pick {{ hunter.playbook.gear.pick }}</legend>
            <div v-for="(gear, index) in hunter.playbook.gear.options" :key="index">
                <label>
                    <input type="checkbox" :value="gear" v-model="hunter.gear" />
                    <span>
                        {{ gear.name }}
                    </span>
                    (<span v-for="tag in gear.tags" :key="tag">
                        {{ tag }}{{ " " }}
                    </span>)
                </label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Other Gear</legend>
            <p>WIP: Add more gear.</p>
        </fieldset>
    </section>

    <!-- Look Section -->
    <section>
        <fieldset>
            <legend>Look</legend>
            <p>WIP: Let user choose eyes, hair, clothes, etc.</p>
        </fieldset>
    </section>

    <!-- History Section -->
    <section>
        <fieldset>
            <legend>History</legend>
            <p>WIP: Describe relationships with other hunters.</p>
        </fieldset>
    </section>
    <section id="pre-moves">
        <PreMove v-for="pm in hunter.playbook.pre_moves" :hunter="hunter" :pm="pm"/>
    </section>
    <section id="improvements">
        <fieldset>
            <legend>Improvements</legend>
            <ul>
                <li v-for="improvement in hunter.playbook.improvements.options" :key="improvement.id">
                    <label>
                        <input type="checkbox" :value="improvement.id" v-model="hunter.improvements" />
                        <span>
                            {{ improvement.description }}
                        </span>
                        <div v-if="debug" class="debug">
                            <div>id: {{ improvement.id }}</div>
                            <div v-if="improvement.increase">
                                increase: {{ improvement.increase }}
                            </div>
                            <div v-if="improvement.amount">
                                amount: {{ improvement.amount }}
                            </div>
                            <div v-if="improvement.max">
                                max: {{ improvement.max }}
                            </div>
                        </div>
                    </label>
                </li>
            </ul>
        </fieldset>
    </section>
    <button @click="$emit('change-view', 'show', hunter)">Save</button>
    <!-- debug switch -->
    <label style="position: fixed; top: 5px; right: 10px;">
        <input type="checkbox" v-model="debug" />
        Debug
    </label>
</template>

<script setup>
import { ref } from 'vue';
import { Hunter } from '@/Hunter';
// import Test from './Test.vue';
import PreMove from './PreMove.vue';

const debug = ref(false);
const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const emit = defineEmits(['change-view']);

const plusOrEqualsOrNothing = (value) => {
    return value > 0 ? '+' : value === 0 ? '=' : '';
};


const fomatRatingRich = (rating) => {
    /*
    {
      "Charm": -1,
      "Cool": 1,
      "Sharp": 1,
      "Tough": 0,
      "Weird": 2
    }
      =>
    "Charm-1, Cool+1, Sharp+1, Tough=0, Weird+2"
    */
    const numberspan = (value) => 
        `<span class="color-${value}">${plusOrEqualsOrNothing(value)}${value}</span>`;
    return Object.entries(rating)
        .map(([key, value]) => `${key}${numberspan(value)}`)
        .join(', ');
};

const addAllMoves = () => {
    const hunter = props.hunter;
    const all_moves = hunter.playbook.moves.children.options;
    for (const move of all_moves) {
        if (!hunter.moves.find((m) => m.name === move.name)) {
            hunter.moves.push(move);
        }
    }
};
</script>

<style scoped>
.hunter-name input {
    /* same as h1 */
    font-size: 1.3em;
    font-weight: 400;
    margin: 0;
    padding: 5px;
    text-align: right;
    background-color: unset;
    /* only border-bottom */
    border: none;
    border-bottom: 3px solid gray;
    width: 50%;
    min-width: 5em;
}

button {
    margin: 1em 0;
    padding: 0.5em 1em;
    border: 1px solid var(--color-button-border);
    border-radius: 5px;
    background-color: var(--color-button-background);
    cursor: pointer;
    box-shadow: 0 0 5px 5px rgba(255, 0, 255, 0.1);
}

fieldset {
    width: fit-content;
}
</style>

<style>
.color--1 {
    color: red;
}
.color-0 {
    color: orange;
}
.color-1 {
    color: yellow;
}
.color-2 {
    color: lawngreen;
}
.color-3 {
    color: turquoise;
}

.debug {
    opacity: 0.5;
    margin-left: 1em;
    font-size: 0.8em;
    font-family: monospace;
}
</style>