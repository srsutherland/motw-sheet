<template>
<section id="ratings" class="show-ratings">
    <table>
        <tr v-for="(value, key) in hunter?.ratings" :key="key">
            <td><div :class="['stat-bubble', 'stat-bubble-'+value]">{{ value }}</div></td>
            <td class="stat-name">{{ key }}</td>
            <td class="basic-moves">
                <ul>
                    <li v-for="move in basicMovesByStat[key]" :key="move">{{ move }}</li>
                </ul>
            </td>
        </tr>
    </table>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import { basicMovesByStat } from '@/BasicMoves';

const hunter = useHunter();
</script>

<style scoped>
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
</style>