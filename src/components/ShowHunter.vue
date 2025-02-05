<template>
    <h1 class="hunter-name">
        {{ props.hunter?.name || "NoName" }}
        {{ props.hunter?.playbook_name ||  "The Unknown" }}
        <button
            @click="$emit('change-view', 'edit', props.hunter)"
            title="Edit"
        >
            🖉
        </button>
    </h1>
    <Ratings :hunter="props.hunter" />
    <Luck :hunter="props.hunter" />
    <Harm :hunter="props.hunter" />
    <Experience :hunter="props.hunter" />
    <Gear :hunter="props.hunter" />

</template>

<script setup>
import { Hunter } from '@/Hunter';
import Ratings from './show/Ratings.vue';
import Harm from './show/Harm.vue';
import Luck from './show/Luck.vue';
import Experience from './show/Experience.vue';
import Gear from './show/Gear.vue';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const basicMovesByStat = {
    Charm: ['Manipulate Someone'],
    Cool: ['Act Under Pressure', 'Help Out'],
    Sharp: ['Investigate a Mystery', 'Read a Bad Situation'],
    Tough: ['Kick Some Ass'],
    Weird: ['Use Magic'],
}
</script>

<style scoped>
@font-face {
    font-family: 'ThirdMan';
    src: url('res/font/3rd%20Man.otf') format('opentype');
}

.hunter-name {
    font-family: 'ThirdMan', 'sans-serif';
    font-weight: normal;
}

h1 button {
    vertical-align: middle;
} 
</style>