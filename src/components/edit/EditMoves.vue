<template>
<section id="moves">
    <fieldset>
        <legend>Moves</legend>
        <MarkdownText :text="hunter.playbook.moves.description" />
        <div v-for="move in grantedMoves" :key="move.path" class="granted">
            <p>
                <strong>{{ move.node.name }}</strong>:
                <MarkdownText :text="shown(move.node, 'description')" inline />
            </p>
            <ChooseRule
                v-for="(rule, i) in rulesOf(move.node)"
                :key="i"
                :rule="rule"
                :self="move.node"
                :set="choiceSet(move.record, move.node, i)"
            />
        </div>
        <GettingStartedChoices :from="`${hunter.playbook.id}.moves`" />
    </fieldset>
</section>
</template>

<script setup>
// Granted moves (with their own choices), then the moves picked in getting_started
import { computed } from 'vue';
import { rulesOf } from '@/Hunter';
import { useHunter, useHunterState, usePageText } from '@/HunterContext';
import { choiceSet } from '@/HunterState';
import MarkdownText from '../shared/MarkdownText.vue';
import ChooseRule from './ChooseRule.vue';
import GettingStartedChoices from './GettingStartedChoices.vue';

const hunter = useHunter();
const state = useHunterState();
const shown = usePageText();

// Moves you get without picking them (Tools and Techniques)
const grantedMoves = computed(() => state.value.moves
    .filter((move) => move.source === 'getting_started'
        && !state.value.picks.some((p) => p.path === move.path)));
</script>

<style scoped>
.granted {
    margin-bottom: 1em;
}
</style>
