<template>
    <h1 class="hunter-name">
        {{ hunter?.name || "NoName" }}
        {{ hunter?.playbook_name ||  "The Unknown" }}
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
    <Ratings />
    <LuckTrack />
    <HarmTrack />
    <ExperienceTrack />
    <Gear />
    <section class="show-moves">
        <h2>Moves</h2>
        <ul>
            <li v-for="move in hunter?.moves" :key="move.name">
                <Move :move="move" />
            </li>
        </ul>
    </section>

</template>

<script setup>
import { useHunter } from '@/HunterContext';
import Ratings from './show/Ratings.vue';
import HarmTrack from './show/HarmTrack.vue';
import LuckTrack from './show/LuckTrack.vue';
import ExperienceTrack from './show/ExperienceTrack.vue';
import Gear from './show/Gear.vue';
import Move from './show/Move.vue';
import { exportHunter } from '@/Storage';

const hunter = useHunter();
</script>

<style scoped>
.hunter-name {
    font-family: 'ThirdMan', 'sans-serif';
    font-weight: normal;
}

h1 button {
    vertical-align: middle;
} 
</style>