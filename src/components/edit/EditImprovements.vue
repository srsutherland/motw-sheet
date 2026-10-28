<template>
<section v-if="takenWithIndex.length || hunter.level" id="improvements">
    <fieldset>
        <legend>Improvements</legend>
        <p><em>Level {{ hunter.level }}</em><AdvancementButton /></p>
        <div
            v-for="{ taken, index, improvement } in takenWithIndex"
            :key="refOf(taken)"
            class="improvement"
        >
            <p :class="{ 'disabled-improvement': isDisabled(hunter, taken) }">
                <MarkdownText :text="improvement.description" inline />
                <em v-if="isDisabled(hunter, taken)"> (disabled: above your current level)</em>
                <button
                    class="small"
                    title="Remove (leaves an improvement unspent)"
                    @click="hunter.improvements.splice(index, 1)"
                >
                    ✕
                </button>
            </p>
            <ChooseRule
                v-for="(rule, i) in rulesOf(improvement)"
                :key="i"
                :rule="rule"
                :self="improvement"
                :set="choiceSet(taken, improvement, i)"
            />
        </div>
    </fieldset>
</section>
</template>

<script setup>
// Improvements taken, with their choices; Advancement takes new ones
import { computed } from 'vue';
import { rulesOf } from '@/Hunter';
import { useHunter } from '@/HunterContext';
import { choiceSet, improvementOf, isDisabled, refOf } from '@/HunterState';
import MarkdownText from '../shared/MarkdownText.vue';
import AdvancementButton from './AdvancementButton.vue';
import ChooseRule from './ChooseRule.vue';

const hunter = useHunter();

// Taken improvements with their index in hunter.improvements (for their source keys)
const takenWithIndex = computed(() => hunter.value.improvements
    .map((taken, index) => ({
        taken,
        index,
        improvement: improvementOf(hunter.value.playbook, taken)?.improvement,
    }))
    .filter(({ taken, improvement }) => improvement && !taken.pending));
</script>

<style scoped>
.disabled-improvement {
    opacity: 0.6;
}
</style>
