<template>
<section class="view-feature">
    <h2>{{ feature.node.name }}</h2>
    <MarkdownText :text="shown(feature.node, 'description')" class="description" />
    <MoveDetails :details="shown(feature.node, 'details')" />
    <p v-if="!chosenGroups.length" class="none"><em>Nothing chosen yet.</em></p>
    <div v-for="group in chosenGroups" :key="group.key">
        <span v-if="group.name" class="group-name">{{ group.name }}:</span>
        <ul>
            <li v-for="item in group.items" :key="item.key" :class="{ crossed: item.crossed }">
                <template v-if="item.node">
                    <strong v-if="item.node.name">{{ item.node.name }}</strong>
                    <span v-if="item.node.name && shown(item.node, 'description')">: </span>
                    <MarkdownText :text="shown(item.node, 'description')" inline />
                    <span v-if="item.node.tags?.length && !item.node.description" class="tags">
                        ({{ item.node.tags.join(' ') }})
                    </span>
                    <!-- its own choice (Pure Drive's emotion), or what's attached (extras) -->
                    <span v-if="item.inner.length"> ({{ item.inner.join(', ') }})</span>
                </template>
                <span v-else>{{ item.text }}</span>
            </li>
        </ul>
    </div>
</section>
</template>

<script setup>
// A playbook feature (Combat Magic, Haven, Curse...) and what the hunter chose from it.
import { computed } from 'vue';
import { useHunter, useHunterState, usePageText } from '@/HunterContext';
import { attachedTo, crossedUnder, picksUnder } from '@/HunterState';
import { optionsOf, pathOf } from '@/PlaybookData';
import MarkdownText from '../shared/MarkdownText.vue';
import MoveDetails from '../shared/MoveDetails.vue';

const props = defineProps({
    feature: { type: Object, required: true }, // from hunterState().features
});

const hunter = useHunter();
const state = useHunterState();
const shown = usePageText();

// Chosen options, in the playbook's order, grouped by sub-list (Bases, Effects); free text
// at the end of its sub-list
const chosenGroups = computed(() => {
    const playbook = hunter.value.playbook;
    const path = props.feature.path;
    const picks = picksUnder(state.value, path);
    const crossed = crossedUnder(state.value, path);
    const attached = new Set(state.value.attached.map((a) => a.by));
    // free text; plain-string options are matched to their sub-list below
    const texts = picks.filter((p) => !p.path);
    const groups = [];
    const groupFor = (node) => {
        const key = node ? pathOf(node, playbook) : path;
        let group = groups.find((g) => g.key === key);
        if (!group) {
            group = { key, name: node?.name, items: [] };
            groups.push(group);
        }
        return group;
    };
    for (const entry of optionsOf(`@${path}`, playbook)) {
        if (attached.has(entry.path)) {
            // shown on what it's attached to
            continue;
        }
        if (entry.node && (crossed.has(entry.path) || picks.some((p) => p.path === entry.path))) {
            const inner = [
                ...picksUnder(state.value, entry.path)
                    .map((p) => p.text ?? p.node?.name ?? p.node?.description),
                ...attachedTo(state.value, entry.path).map((node) => node.name),
            ];
            groupFor(entry.group).items.push({ ...entry, crossed: crossed.has(entry.path), inner });
        } else if (entry.literal) {
            // "Add +1 harm to a base": in its own sub-list (Extras)
            const at = texts.findIndex((p) => p.literal && p.text === entry.text);
            if (at >= 0) {
                groupFor(entry.group).items.push({ key: entry.key, text: entry.text });
                texts.splice(at, 1);
            }
        } else if (entry.textbox) {
            // free text lands at the end of its sub-list
            groupFor(entry.group);
        }
    }
    for (const [i, pick] of texts.entries()) {
        const group = groups.find((g) => g.key === pick.container) ?? groupFor(null);
        group.items.push({ key: `text${i}`, text: pick.text });
    }
    // keep the order of the sub-lists, but drop those with nothing chosen
    return groups.filter((g) => g.items.length);
});
</script>

<style scoped>
.view-feature {
    max-width: 40em;
}

.view-feature h2 {
    margin-bottom: 0.25em;
}

.group-name {
    font-weight: bold;
}

ul {
    margin: 0.25em 0;
}

.crossed {
    text-decoration: line-through;
    opacity: 0.6;
}
</style>
