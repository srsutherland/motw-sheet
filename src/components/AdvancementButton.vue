<template>
<button v-if="budget.unspent" class="advancement" @click="picking = true">
    Advancement (+{{ budget.unspent }})
</button>
<span v-else-if="budget.disabled.size" class="disabled-note">
    {{ budget.disabled.size }} improvement{{ budget.disabled.size > 1 ? 's' : '' }} disabled
</span>
<ImprovementPicker v-if="picking" @done="picking = false" />
</template>

<script setup>
// "Advancement (+N)": spend unspent improvements. Or, after leveling down,
// how many improvements are disabled until the hunter levels back up.
import { computed, ref } from 'vue';
import { useHunter } from '@/HunterContext';
import { improvementBudget } from '@/HunterState';
import ImprovementPicker from './ImprovementPicker.vue';

const hunter = useHunter();
const picking = ref(false);

const budget = computed(() => improvementBudget(hunter.value));
</script>

<style scoped>
.advancement {
    margin-left: 0.5em;
}

.disabled-note {
    margin-left: 0.5em;
    font-style: italic;
    opacity: 0.8;
}
</style>
