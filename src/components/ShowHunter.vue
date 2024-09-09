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
    <section>
        <table>
            <tr v-for="(value, key) in props.hunter?.ratings" :key="key">
                <td><div :class="['stat-bubble', 'stat-bubble-'+value]">{{ value }}</div></td>
                <td class="stat-name">{{ key }}</td>
                <td class="basic-moves">
                    <ul>
                        <li v-for="move in basicMovesByStat[key]">{{ move }}</li>
                    </ul>
                </td>
            </tr>
        </table>
    </section>
    <Luck :hunter="props.hunter" />
    <Harm :hunter="props.hunter" />
    <Experience :hunter="props.hunter" />

</template>

<script setup>
import { Hunter } from '@/Hunter';
import Harm from './show/Harm.vue';
import Luck from './show/Luck.vue';
import Experience from './show/Experience.vue';

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

.stat-bubble {
    display: inline-block;
    width: 2em;
    height: 2em;
    border-radius: 50%;
    border: 3px solid grey;
    text-align: center;
    line-height: 2em;
    margin: 3px;
}

.stat-name {
    padding-left: .7em;
    font-size: 1.7em;
    font-family: 'ThirdMan', 'sans-serif';
    font-weight: normal;
}

td ul {
    margin: 0;
}

.stat-bubble--1 {
    background-color: hsl(0, 100%, 50%, 0.1);
}

.stat-bubble-0 {
    background-color: hsl(39, 100%, 50%, 0.1);
}

.stat-bubble-1 {
    background-color: hsla(60, 100%, 50%, 0.1);
}

.stat-bubble-2 {
    background-color: hsl(120, 100%, 50%, 0.1);
}

.stat-bubble-3 {
    background-color: hsl(180, 100%, 50%, 0.1);
}

h1 button {
    vertical-align: middle;
} 
</style>