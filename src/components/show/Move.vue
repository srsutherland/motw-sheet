<template>
<div class="show-move">
    <span class="move-name">{{ move?.name }}: </span>
    <MarkdownText :text="move?.description" inline />
    <ul v-if="move?.details?.length">
        <li v-for="detail in move.details" :key="detail.name">
            <span class="move-name">{{ detail.name }}: </span>
            <MarkdownText :text="detail.description" inline />
        </li>
    </ul>
    <!-- the move's own choices: Practitioner's effects, crossed-off Tools and Techniques... -->
    <ul v-for="(rule, i) in asList(move?.choose)" :key="i" class="choices">
        <template v-if="verbOf(rule) === 'cross'">
            <li
                v-for="entry in optionsOf(rule.from, hunter.playbook, move)"
                :key="entry.key"
                :class="{ crossed: crossed.has(entry.path) }"
            >
                <strong>{{ entry.node.name }}</strong>:
                <MarkdownText :text="entry.node.description" inline />
            </li>
        </template>
        <template v-else>
            <li v-for="pick in picks" :key="pick.path ?? pick.text">
                <strong v-if="pick.node?.name">{{ pick.node.name }}</strong>
                <span v-if="pick.node?.name && pick.node?.description">: </span>
                <MarkdownText v-if="pick.node" :text="pick.node.description" inline />
                <span v-else>{{ pick.text }}</span>
            </li>
            <li v-if="!picks.length"><em>Nothing chosen yet.</em></li>
        </template>
    </ul>
</div>
</template>

<script setup>
import { computed } from 'vue';
import { asList } from '@/Hunter';
import { useHunter, useHunterState } from '@/HunterContext';
import { crossedUnder, picksUnder, verbOf } from '@/HunterState';
import { optionsOf } from '@/PlaybookData';
import MarkdownText from '../MarkdownText.vue';

const props = defineProps({
    move: Object,
    path: String,
});

const hunter = useHunter();
const state = useHunterState();

const picks = computed(() => picksUnder(state.value, props.path));
const crossed = computed(() => crossedUnder(state.value, props.path));
</script>

<style scoped>
.show-move {
    margin-bottom: 1em;
    max-width: 40em;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.move-name {
    font-weight: bold;
}

.choices {
    margin: 0.25em 0;
}

.crossed {
    text-decoration: line-through;
    opacity: 0.6;
}
</style>
