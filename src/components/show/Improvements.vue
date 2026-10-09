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
    findImprovement, isDisabled, pathOfChoice, refOf, takenImprovements,
} from '@/HunterState';
import { TEXTBOX, lookup } from '@/PlaybookData';
import MarkdownText from '../MarkdownText.vue';

const hunter = useHunter();

// Read from the improvement's own record, so disabled improvements show their choices too
const nameOf = (choice) => {
    if (choice?.id === TEXTBOX) {
        return choice.text;
    }
    const node = lookup(pathOfChoice(choice), hunter.value.playbook);
    return node?.name ?? node?.description ?? refOf(choice);
};

const taken = computed(() => takenImprovements(hunter.value)
    .map((record) => ({
        id: record.id,
        disabled: isDisabled(hunter.value, record),
        improvement: findImprovement(hunter.value.playbook, record.id)?.improvement,
        chosen: (record.choose ?? []).flatMap((set) => set.choices).map(nameOf),
    }))
    .filter(({ improvement }) => improvement));
</script>

<style scoped>
.show-improvements {
    max-width: 40em;
}

.disabled {
    opacity: 0.6;
}
</style>
