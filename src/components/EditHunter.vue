<template>
<h1 class="hunter-name">
    <input v-model="hunter.name" placeholder="Name"/>
    {{ hunter?.playbook_name }}
</h1>
<p class="pronouns">
    <label>Pronouns: <input v-model="hunter.pronouns" placeholder="pronouns" /></label>
</p>

<!-- Current ratings (picked below, under Ratings) -->
<p v-if="hunter.ratings_base" class="current-ratings" v-html="fomatRatingRich(state.ratings)"></p>

<!-- Gear Section -->
<section id="gear">
    <fieldset>
        <legend>Starting Gear</legend>
        <MarkdownText :text="startingGear?.description" />
        <GettingStartedChoices :from="`${playbookId}.starting_gear`" />
    </fieldset>
    <fieldset>
        <legend>Other Gear</legend>
        <ul class="plain">
            <li v-for="(item, i) in hunter.extra_gear" :key="i">
                <input v-model="item.name" placeholder="name" />
                <input
                    :value="item.tags.join(' ')"
                    placeholder="tags (space separated)"
                    @change="item.tags = $event.target.value.split(/\s+/).filter(Boolean)"
                />
                <button class="small" title="Remove" @click="hunter.extra_gear.splice(i, 1)">
                    ✕
                </button>
            </li>
        </ul>
        <button class="small" @click="hunter.extra_gear.push({ name: '', tags: [] })">
            Add gear
        </button>
    </fieldset>
</section>

<!-- Moves Section -->
<section id="moves">
    <fieldset>
        <legend>Moves</legend>
        <MarkdownText :text="hunter.playbook.moves.description" />
        <div v-for="move in grantedMoves" :key="move.path" class="granted">
            <p>
                <strong>{{ move.node.name }}</strong>:
                <MarkdownText :text="move.node.description" inline />
            </p>
            <ChooseRule
                v-for="(rule, i) in asList(move.node.choose)"
                :key="i"
                :rule="rule"
                :self="move.node"
                :source-key="{ kind: 'nested', path: move.path, rule: i }"
            />
        </div>
        <GettingStartedChoices :from="`${playbookId}.moves`" />
    </fieldset>
</section>

<!-- Playbook-specific features -->
<section id="features">
    <EditFeature v-for="feature in state.features" :key="feature.path" :feature="feature" />
</section>

<!-- getting_started choices that don't belong to any section above -->
<section v-if="otherRules.length" id="other-choices">
    <fieldset>
        <legend>Other choices</legend>
        <ChooseRule
            v-for="{ rule, index } in otherRules"
            :key="index"
            :rule="rule"
            :self="hunter.playbook.getting_started"
            :source-key="{ kind: 'getting_started', rule: index }"
        />
    </fieldset>
</section>

<!-- Look Section -->
<section id="look">
    <fieldset>
        <legend>Look</legend>
        <p v-if="hunter.playbook.look.heading">{{ hunter.playbook.look.heading }}</p>
        <div v-for="(list, key) in lookLists" :key="key" class="look-list">
            <label v-for="option in list.options.filter((o) => o !== TEXTBOX)" :key="option">
                <input type="radio" :value="option" v-model="hunter.look[key]" />
                {{ option }}
            </label>
            <input
                v-if="list.options.includes(TEXTBOX)"
                class="textbox"
                placeholder="write your own"
                :value="list.options.includes(hunter.look[key]) ? '' : hunter.look[key]"
                @change="hunter.look[key] = $event.target.value.trim()"
            />
            <span class="format">{{ list.format }}</span>
        </div>
    </fieldset>
</section>

<!-- Ratings Selection -->
<section id="edit-ratings">
    <fieldset>
        <legend>{{ hunter.playbook.ratings_base.heading ?? 'Ratings, pick one line:' }}</legend>
        <div v-for="(rating, i) in hunter.playbook.ratings_base.options" :key="i">
            <label>
                <input
                    type="radio"
                    :value="rating"
                    v-model="hunter.ratings_base"
                />
                <span v-html="fomatRatingRich(rating)"></span>
            </label>
        </div>
    </fieldset>
</section>

<!-- History Section -->
<section id="history">
    <fieldset>
        <legend>History</legend>
        <MarkdownText :text="hunter.playbook.history.description" />
        <div v-for="(entry, i) in hunter.history" :key="i" class="history-entry">
            <input v-model="entry.name" placeholder="other hunter's name" />
            <select @change="entry.option = $event.target.value; $event.target.value = ''">
                <option value="">pick from the playbook…</option>
                <option
                    v-for="option in hunter.playbook.history.options"
                    :key="option"
                    :value="option"
                >
                    {{ option }}
                </option>
            </select>
            <textarea v-model="entry.option" placeholder="how you know them" rows="2"></textarea>
            <textarea v-model="entry.notes" placeholder="notes" rows="1"></textarea>
            <button class="small" @click="hunter.history.splice(i, 1)" title="Remove">✕</button>
        </div>
        <button class="small" @click="hunter.history.push({ name: '', option: '', notes: '' })">
            Add a hunter
        </button>
    </fieldset>
</section>

<button @click="$emit('change-view', 'show', hunter)">Save</button>
<!-- escape valve: lift pick limits -->
<label class="bend-rules" title="Lift pick limits, e.g. for house rules or Keeper rulings">
    <input type="checkbox" v-model="bendRules" />
    Bend the rules
</label>
</template>

<script setup>
import { computed, provide, ref } from 'vue';
import { asList } from '@/Hunter';
import { useHunter, useHunterState } from '@/HunterContext';
import { gettingStartedRules } from '@/HunterState';
import { TEXTBOX } from '@/PlaybookData';
import ChooseRule from './ChooseRule.vue';
import MarkdownText from './MarkdownText.vue';
import EditFeature from './edit/EditFeature.vue';
import GettingStartedChoices from './edit/GettingStartedChoices.vue';

const hunter = useHunter();
const state = useHunterState();

const emit = defineEmits(['change-view']);

const bendRules = ref(false);
provide('bendRules', bendRules);

const playbookId = computed(() => hunter.value.playbook.id);
const startingGear = computed(() => hunter.value.playbook.starting_gear);

// look: { heading, clothes: { format, options }, eyes: {...} }
const lookLists = computed(() => Object.fromEntries(Object.entries(hunter.value.playbook.look)
    .filter(([key]) => key !== 'heading')));

// Moves you get without picking them (Tools and Techniques)
const grantedMoves = computed(() => state.value.moves
    .filter((move) => move.source === 'getting_started'
        && !state.value.picks.some((p) => p.path === move.path)));

const otherRules = computed(() => {
    const id = playbookId.value;
    const shown = new Set([
        `${id}.moves`,
        `${id}.starting_gear`,
        ...state.value.features.map((feature) => feature.path),
    ]);
    return gettingStartedRules(hunter.value).filter(({ container }) => !shown.has(container));
});

const plusOrEqualsOrNothing = (value) => {
    return value > 0 ? '+' : value === 0 ? '=' : '';
};

const fomatRatingRich = (rating) => {
    /*
    { "charm": -1, "cool": 1, "sharp": 1, "tough": 0, "weird": 2 }
      =>
    "Charm-1, Cool+1, Sharp+1, Tough=0, Weird+2"
    */
    const numberspan = (value) =>
        `<span class="color-${value}">${plusOrEqualsOrNothing(value)}${value}</span>`;
    const capitalized = (key) => key[0].toUpperCase() + key.slice(1);
    return Object.entries(rating)
        .map(([key, value]) => `${capitalized(key)}${numberspan(value)}`)
        .join(', ');
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

button.small {
    margin: 0.25em;
    padding: 0.1em 0.5em;
}

fieldset {
    width: fit-content;
    max-width: 50em;
    margin-bottom: 1em;
}

ul.plain {
    list-style: none;
    padding-left: 0;
}

.look-list {
    margin: 0.5em 0;
}

.look-list label {
    margin-right: 1em;
}

.format {
    opacity: 0.7;
    margin-left: 0.5em;
}

.textbox {
    width: 10em;
}

.history-entry {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
    align-items: flex-start;
    margin: 0.5em 0;
}

.history-entry select {
    max-width: 12em;
}

.history-entry textarea {
    min-width: 15em;
}

.granted {
    margin-bottom: 1em;
}

.bend-rules {
    position: fixed;
    top: 5px;
    right: 10px;
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
</style>
