<template>
<section id="ratings" class="show-ratings">
    <table>
        <tr v-for="rating in RATINGS" :key="rating">
            <td>
                <div :class="['stat-bubble', 'stat-bubble-' + state.ratings[rating]]">
                    {{ state.ratings[rating] }}
                </div>
            </td>
            <td class="stat-name">{{ rating }}</td>
            <td class="basic-moves">
                <ul>
                    <li v-for="move in basicMovesByRating(rating)" :key="move.name">
                        {{ move.name }}
                        <em v-if="isAdvanced(move)">(advanced)</em>
                    </li>
                </ul>
            </td>
        </tr>
    </table>
</section>
</template>

<script setup>
import { useHunterState } from '@/HunterContext';
import { RATINGS, basicMovesByRating } from '@/HunterState';
import { pathOf } from '@/PlaybookData';

const state = useHunterState();

const isAdvanced = (move) => state.value.advanced.has(pathOf(move));
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
    text-transform: capitalize;
    padding-left: .7em;
    font-size: 1.7em;
    font-family: 'ThirdMan', 'sans-serif';
    letter-spacing: 0.1em;
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
