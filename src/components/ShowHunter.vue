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
<Ratings />
<LuckTrack />
<HarmTrack />
<ExperienceTrack />
<Gear />
<Feature v-for="feature in features('pre_moves')" :key="feature.path" :feature="feature" />
<section class="show-moves">
    <h2>Moves</h2>
    <ul>
        <li v-for="move in state.moves" :key="move.path">
            <Move :move="move.node" :path="move.path" />
        </li>
    </ul>
</section>
<Feature v-for="feature in features('post_moves')" :key="feature.path" :feature="feature" />
<History />
<Improvements />
</template>

<script setup>
import { computed } from 'vue';
import { useHunter, useHunterState } from '@/HunterContext';
import Ratings from './show/Ratings.vue';
import HarmTrack from './show/HarmTrack.vue';
import LuckTrack from './show/LuckTrack.vue';
import ExperienceTrack from './show/ExperienceTrack.vue';
import Feature from './show/Feature.vue';
import Gear from './show/Gear.vue';
import History from './show/History.vue';
import Improvements from './show/Improvements.vue';
import Move from './show/Move.vue';
import { exportHunter } from '@/Storage';

const hunter = useHunter();
const state = useHunterState();

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
