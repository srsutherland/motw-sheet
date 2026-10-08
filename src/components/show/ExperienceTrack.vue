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
    <ImprovementPicker v-if="picking" :level-up="picking === 'level'" @done="picking = null" />
</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useHunter } from '@/HunterContext';
import { unspentImprovements } from '@/HunterState';
import ImprovementPicker from '../ImprovementPicker.vue';
import Track from './Track.vue';

const hunter = useHunter();
const picking = ref(null); // 'level' | 'unspent' | null

const unspent = computed(() => unspentImprovements(hunter.value));
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

</style>
