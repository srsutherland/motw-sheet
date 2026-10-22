<template>
<fieldset class="feature">
    <legend>{{ feature.node.name }}</legend>
    <MarkdownText :text="feature.node.description" />
    <p v-if="feature.node.heading"><MarkdownText :text="feature.node.heading" inline /></p>
    <GettingStartedChoices :from="feature.path" />
    <!-- a feature gained from another playbook: its choices are on the improvement -->
    <ul v-if="feature.source !== 'playbook'">
        <li v-for="pick in picksUnder(state, feature.path)" :key="pick.path ?? pick.text">
            {{ pick.node?.name ?? pick.node?.description ?? pick.text }}
        </li>
    </ul>
    <!-- reference only (Monster Breed Suggestions) -->
    <details v-if="feature.node.suggestions?.length" class="suggestions">
        <summary>Suggestions</summary>
        <MoveDetails :details="feature.node.suggestions" />
    </details>
</fieldset>
</template>

<script setup>
import { useHunterState } from '@/HunterContext';
import { picksUnder } from '@/HunterState';
import MarkdownText from '../MarkdownText.vue';
import MoveDetails from '../show/MoveDetails.vue';
import GettingStartedChoices from './GettingStartedChoices.vue';

const props = defineProps({
    feature: { type: Object, required: true }, // from hunterState().features
});

const state = useHunterState();
</script>

<style scoped>
.suggestions summary {
    cursor: pointer;
}
</style>
