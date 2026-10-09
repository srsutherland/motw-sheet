<template>
<section class="show-improvements">
    <h2>Improvements</h2>
    <p v-if="!taken.length"><em>None yet.</em></p>
    <ul>
        <li
            v-for="{ id, improvement, chosen, disabled } in taken"
            :key="id"
            :class="{ disabled }"
        >
            <MarkdownText :text="improvement.description" inline />
            <span v-if="chosen.length">: {{ chosen.join(', ') }}</span>
            <em v-if="disabled"> (disabled: above your current level)</em>
        </li>
    </ul>
</section>
</template>

<script setup>
// Improvements taken, each with what was chosen for it
// ("Take another Spell-slinger move: Third Eye")
import { computed } from 'vue';
import { useHunter } from '@/HunterContext';
import {
    chosenFor, improvementOf, isDisabled, refOf, takenImprovements,
} from '@/HunterState';
import MarkdownText from '../MarkdownText.vue';

const hunter = useHunter();

// Read from the improvement's own record, so disabled improvements show their choices too
const taken = computed(() => takenImprovements(hunter.value)
    .map((record) => ({
        id: refOf(record),
        disabled: isDisabled(hunter.value, record),
        improvement: improvementOf(hunter.value.playbook, record)?.improvement,
        record,
    }))
    .filter(({ improvement }) => improvement)
    .map((item) => ({
        ...item,
        chosen: chosenFor(hunter.value.playbook, item.improvement, item.record)
            .map((c) => c.text ?? c.node.name ?? c.node.description),
    })));
</script>

<style scoped>
.show-improvements {
    max-width: 40em;
}

.disabled {
    opacity: 0.6;
}
</style>
