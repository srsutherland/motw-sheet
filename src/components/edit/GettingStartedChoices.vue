<template>
<div v-for="{ rule, index, set, container } in rules" :key="index">
    <!-- a rule picking from one of the container's sub-lists (Monster Breed's Origin) -->
    <p v-if="container !== from" class="sub-list-name">{{ nameOf(container) }}:</p>
    <ChooseRule
        :rule="rule"
        :self="hunter.playbook.getting_started"
        :set="set"
    />
</div>
</template>

<script setup>
// The getting_started choices that pick from one container (a feature, the moves list,
// the starting gear) or its sub-lists, so each can be shown in its own section of the
// edit page.
import { computed } from 'vue';
import { useHunter } from '@/HunterContext';
import { gettingStartedRules } from '@/HunterState';
import { lookup } from '@/PlaybookData';
import ChooseRule from '../ChooseRule.vue';

const props = defineProps({
    from: { type: String, required: true }, // absolute path of the container
});

const hunter = useHunter();

const rules = computed(() => gettingStartedRules(hunter.value)
    .filter(({ container }) => container === props.from
        || container.startsWith(`${props.from}.`)));

const nameOf = (path) => lookup(path, hunter.value.playbook)?.name ?? path;
</script>

<style scoped>
.sub-list-name {
    font-weight: bold;
    margin-bottom: 0;
}
</style>
