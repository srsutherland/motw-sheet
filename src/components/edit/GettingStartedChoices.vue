<template>
<ChooseRule
    v-for="{ rule, index, set } in rules"
    :key="index"
    :rule="rule"
    :self="hunter.playbook.getting_started"
    :set="set"
/>
</template>

<script setup>
// The getting_started choices that pick from one container (a feature, the moves list,
// the starting gear), so each can be shown in its own section of the edit page.
import { computed } from 'vue';
import { useHunter } from '@/HunterContext';
import { gettingStartedRules } from '@/HunterState';
import ChooseRule from '../ChooseRule.vue';

const props = defineProps({
    from: { type: String, required: true }, // absolute path of the container
});

const hunter = useHunter();

const rules = computed(() => gettingStartedRules(hunter.value)
    .filter(({ container }) => container === props.from));
</script>
