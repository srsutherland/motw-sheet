<template>
<section id="improvements">
    <fieldset>
        <legend>Improvements</legend>
        <p>
            <em>Level {{ hunter.level }}</em>
            <span v-if="newLevel !== null" class="set-level">
                <input
                    v-model.number="newLevel"
                    type="number"
                    min="0"
                    step="1"
                    aria-label="New level"
                    @keyup.enter="setLevel"
                />
                <button class="small" @click="setLevel">Set</button>
                <button class="small" @click="newLevel = null">Cancel</button>
            </span>
            <button
                v-else
                class="small"
                title="Set the level directly (existing hunters)"
                @click="newLevel = hunter.level"
            >
                Set level
            </button>
            <AdvancementButton />
        </p>
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
                    @click="remove(index, improvement)"
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
import { computed, ref } from 'vue';
import { rulesOf } from '@/Hunter';
import { useHunter } from '@/HunterContext';
import { choiceSet, improvementOf, isDisabled, newlyDisabledAt, refOf } from '@/HunterState';
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

// The level being typed into "Set level" (null: not setting it)
const newLevel = ref(null);

/**
 * Sets the level from the "Set level" field, after confirming if that disables improvements.
 * @returns {void}
 */
const setLevel = () => {
    const h = hunter.value;
    const level = newLevel.value;
    if (!Number.isInteger(level) || level < 0) {
        return;
    }
    const disabling = newlyDisabledAt(h, level);
    const plural = disabling > 1 ? 's' : '';
    if (disabling && !confirm(`Set level to ${level}?\n\n${disabling} improvement${plural}`
        + ' will be disabled (choices kept) until you level up again.')) {
        return;
    }
    h.level = level;
    newLevel.value = null;
};

/**
 * Removes a taken improvement, after confirming.
 * @param {number} index Its index in hunter.improvements
 * @param {object} improvement The playbook's improvement
 * @returns {void}
 */
const remove = (index, improvement) => {
    if (confirm(`Remove this improvement?\n\n${improvement.description}\n\nIts choices will be lost.`)) {
        hunter.value.improvements.splice(index, 1);
    }
};
</script>

<style scoped>
.disabled-improvement {
    opacity: 0.6;
}

.set-level input {
    width: 4em;
    margin-left: 0.5em;
}
</style>
