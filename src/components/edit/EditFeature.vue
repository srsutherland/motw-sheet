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
</fieldset>
</template>

<script setup>
import { useHunterState } from '@/HunterContext';
import { picksUnder } from '@/HunterState';
import MarkdownText from '../MarkdownText.vue';
import GettingStartedChoices from './GettingStartedChoices.vue';

const props = defineProps({
    feature: { type: Object, required: true }, // from hunterState().features
});

const state = useHunterState();
</script>
