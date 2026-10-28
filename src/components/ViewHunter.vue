<template>
<h1 class="hunter-name">
    {{ hunter.toString() }}
    <button
        @click="$emit('change-view', 'edit', hunter)"
        title="Edit"
    >
        🖉
    </button>
    <button @click="exportHunter(hunter)" title="Export to file">
        ⭳
    </button>
</h1>
<p v-if="hunter.pronouns || look" class="subtitle">
    <span v-if="hunter.pronouns">({{ hunter.pronouns }})</span>
    {{ look }}
</p>
<ViewRatings />
<ViewLuckTrack />
<ViewHarmTrack />
<ViewExperienceTrack />
<ViewGear />
<ViewFeature v-for="feature in features('pre_moves')" :key="feature.path" :feature="feature" />
<section class="view-moves">
    <h2>Moves</h2>
    <ul>
        <li v-for="move in state.moves" :key="move.path">
            <Move :move="move.node" :path="move.path" />
        </li>
    </ul>
</section>
<ViewFeature v-for="feature in features('post_moves')" :key="feature.path" :feature="feature" />
<ViewHistory />
<ViewImprovements />
</template>

<script setup>
import { computed } from 'vue';
import { providePage, useHunter, useHunterState } from '@/HunterContext';
import ViewRatings from './view/ViewRatings.vue';
import ViewHarmTrack from './view/ViewHarmTrack.vue';
import ViewLuckTrack from './view/ViewLuckTrack.vue';
import ViewExperienceTrack from './view/ViewExperienceTrack.vue';
import ViewFeature from './view/ViewFeature.vue';
import ViewGear from './view/ViewGear.vue';
import ViewHistory from './view/ViewHistory.vue';
import ViewImprovements from './view/ViewImprovements.vue';
import Move from './view/Move.vue';
import { exportHunter } from '@/Storage';

const hunter = useHunter();
const state = useHunterState();
providePage('view');

const features = (area) => state.value.features.filter((feature) => feature.area === area);

// "rumpled clothes, weary eyes"
const look = computed(() => Object.entries(hunter.value.playbook.look)
    .filter(([key]) => key !== 'heading' && hunter.value.look[key])
    .map(([key, list]) => list.format.replace('___', hunter.value.look[key]))
    .join(', '));
</script>

<style scoped>
.hunter-name {
    font-family: 'ThirdMan', 'sans-serif';
    letter-spacing: 0.1em;
    font-variant: small-caps;
    font-weight: normal;
}

h1 button {
    vertical-align: middle;
}
</style>
