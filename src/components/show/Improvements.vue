<template>
<section class="show-improvements">
    <h2>Improvements</h2>
    <p v-if="!taken.length"><em>None yet.</em></p>
    <ul>
        <li v-for="{ id, improvement, chosen } in taken" :key="id">
            <MarkdownText :text="improvement.description" inline />
            <span v-if="chosen.length">: {{ chosen.join(', ') }}</span>
        </li>
    </ul>
</section>
</template>

<script setup>
// Improvements taken, each with what was chosen for it
// ("Take another Spell-slinger move: Third Eye")
import { computed } from 'vue';
import { useHunter, useHunterState } from '@/HunterContext';
import { findImprovement, takenImprovements } from '@/HunterState';
import MarkdownText from '../MarkdownText.vue';

const hunter = useHunter();
const state = useHunterState();

const taken = computed(() => takenImprovements(hunter.value)
    .map(({ id }) => ({
        id,
        improvement: findImprovement(hunter.value.playbook, id)?.improvement,
        chosen: state.value.picks
            .filter((p) => p.source === id)
            .map((p) => p.node?.name ?? p.node?.description ?? p.text),
    }))
    .filter(({ improvement }) => improvement));
</script>
