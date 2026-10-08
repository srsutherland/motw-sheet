<template>
<section class="show-feature">
    <h2>{{ feature.node.name }}</h2>
    <MarkdownText :text="feature.node.description" class="description" />
    <p v-if="!chosenGroups.length" class="none"><em>Nothing chosen yet.</em></p>
    <div v-for="group in chosenGroups" :key="group.name ?? ''">
        <span v-if="group.name" class="group-name">{{ group.name }}:</span>
        <ul>
            <li v-for="entry in group.entries" :key="entry.key">
                <strong v-if="entry.node?.name">{{ entry.node.name }}</strong>
                <span v-if="entry.node?.name && entry.node?.description">: </span>
                <MarkdownText v-if="entry.node" :text="entry.node.description" inline />
                <span v-else>{{ entry.text }}</span>
            </li>
        </ul>
    </div>
</section>
</template>

<script setup>
// A playbook feature (Combat Magic, Haven...) and what the hunter chose from it.
import { computed } from 'vue';
import { useHunter, useHunterState } from '@/HunterContext';
import { picksUnder } from '@/HunterState';
import { optionsOf } from '@/PlaybookData';
import MarkdownText from '../MarkdownText.vue';

const props = defineProps({
    feature: { type: Object, required: true }, // from hunterState().features
});

const hunter = useHunter();
const state = useHunterState();

// Chosen options, in the playbook's order, grouped by sub-list (Bases, Effects)
const chosenGroups = computed(() => {
    const picks = picksUnder(state.value, props.feature.path);
    const paths = new Set(picks.map((p) => p.path));
    const groups = [];
    for (const entry of optionsOf(`@${props.feature.path}`, hunter.value.playbook)) {
        if (!paths.has(entry.path)) {
            continue;
        }
        let group = groups.find((g) => g.node === entry.group);
        if (!group) {
            group = { node: entry.group, name: entry.group?.name, entries: [] };
            groups.push(group);
        }
        group.entries.push(entry);
    }
    const texts = picks.filter((p) => !p.path).map((p, i) => ({ key: `text${i}`, text: p.text }));
    if (texts.length) {
        groups.push({ node: null, name: null, entries: texts });
    }
    return groups;
});
</script>

<style scoped>
.show-feature h2 {
    margin-bottom: 0.25em;
}

.group-name {
    font-weight: bold;
}

ul {
    margin: 0.25em 0;
}
</style>
