<template>
<div class="edit-hunter">
    <h1 class="hunter-name">
        <input v-model="hunter.name" placeholder="Name"/>
        {{ hunter?.playbook_name }}
    </h1>
    <p class="pronouns">
        <label>Pronouns: <input v-model="hunter.pronouns" placeholder="pronouns" /></label>
    </p>

    <!-- Current ratings (picked below, under Ratings) -->
    <p
        v-if="hunter.ratings_base"
        class="current-ratings"
        v-html="ratingLineHtml(state.ratings)"
    ></p>

    <EditGear />
    <EditMoves />

    <!-- Playbook-specific features -->
    <section id="features">
        <EditFeature v-for="feature in state.features" :key="feature.path" :feature="feature" />
    </section>

    <!-- getting_started choices that don't belong to any section above -->
    <section v-if="otherRules.length" id="other-choices">
        <fieldset>
            <legend>Other choices</legend>
            <ChooseRule
                v-for="{ rule, index, set } in otherRules"
                :key="index"
                :rule="rule"
                :self="hunter.playbook.getting_started"
                :set="set"
            />
        </fieldset>
    </section>

    <EditLook />
    <EditRatings />
    <EditHistory />
    <EditImprovements />

    <button @click="$emit('change-view', 'view', hunter)">Save</button>
    <!-- escape valve: lift pick limits -->
    <label class="bend-rules" title="Lift pick limits, e.g. for house rules or Keeper rulings">
        <input type="checkbox" v-model="bendRules" />
        Bend the rules
    </label>
</div>
</template>

<script setup>
import { computed, provide, ref } from 'vue';
import { ratingLineHtml } from '@/Format';
import { providePage, useHunter, useHunterState } from '@/HunterContext';
import { gettingStartedRules } from '@/HunterState';
import ChooseRule from './edit/ChooseRule.vue';
import EditFeature from './edit/EditFeature.vue';
import EditGear from './edit/EditGear.vue';
import EditHistory from './edit/EditHistory.vue';
import EditImprovements from './edit/EditImprovements.vue';
import EditLook from './edit/EditLook.vue';
import EditMoves from './edit/EditMoves.vue';
import EditRatings from './edit/EditRatings.vue';

const hunter = useHunter();
const state = useHunterState();
providePage('edit');

const emit = defineEmits(['change-view']);

const bendRules = ref(false);
provide('bendRules', bendRules);

// Rules not shown by a section: anything but the moves, the gear and the features
const otherRules = computed(() => {
    const id = hunter.value.playbook.id;
    const shown = new Set([
        `${id}.moves`,
        `${id}.starting_gear`,
        ...state.value.features.map((feature) => feature.path),
    ]);
    // a rule picking from a sub-list of a shown container is shown with it
    return gettingStartedRules(hunter.value).filter(({ container }) => ![...shown]
        .some((path) => container === path || container.startsWith(`${path}.`)));
});
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

.bend-rules {
    position: fixed;
    top: 5px;
    right: 10px;
}
</style>

<!-- For every section of the edit page -->
<style>
.edit-hunter button {
    margin: 1em 0;
    padding: 0.5em 1em;
    border: 1px solid var(--color-button-border);
    border-radius: 5px;
    background-color: var(--color-button-background);
    cursor: pointer;
    box-shadow: 0 0 5px 5px rgba(255, 0, 255, 0.1);
}

.edit-hunter button.small {
    margin: 0.25em;
    padding: 0.1em 0.5em;
}

.edit-hunter fieldset {
    width: fit-content;
    max-width: 50em;
    margin-bottom: 1em;
}

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
