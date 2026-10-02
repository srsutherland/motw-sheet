<template>
<section class="show-experience">
    <span class="heading">Experience</span>:
    <Track class="indent" v-model="hunter.experience" :max="5" />
    <div class="indent">
        <span class="indent">
            <em>Level {{ hunter?.level }}</em>
            <button v-if="hunter?.experience >= 5" @click="picking = 'level'">Level up</button>
            <button v-else-if="unspent" @click="picking = 'unspent'">
                Take an improvement ({{ unspent }} unspent)
            </button>
        </span>
    </div>
    <ul v-if="taken.length" class="indent improvements">
        <li v-for="improvement in taken" :key="improvement.id">
            <MarkdownText :text="improvement.description" inline />
        </li>
    </ul>
    <ImprovementPicker v-if="picking" :level-up="picking === 'level'" @done="picking = null" />
</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useHunter } from '@/HunterContext';
import { findImprovement, takenImprovements, unspentImprovements } from '@/HunterState';
import ImprovementPicker from '../ImprovementPicker.vue';
import MarkdownText from '../MarkdownText.vue';
import Track from './Track.vue';

const hunter = useHunter();
const picking = ref(null); // 'level' | 'unspent' | null

const unspent = computed(() => unspentImprovements(hunter.value));

const taken = computed(() => takenImprovements(hunter.value)
    .map((t) => findImprovement(hunter.value.playbook, t.id)?.improvement)
    .filter(Boolean));
</script>

<style scoped>
.indent {
    margin-left: 1em;
}

.heading {
    font-weight: bold;
    /* all caps */
    text-transform: uppercase;
}

.improvements {
    margin: 0.25em 0 0 1em;
    font-size: 0.9em;
}
</style>
