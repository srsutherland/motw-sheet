<template>
<section class="show-experience">
    <span class="heading">Experience</span>:
    <Track class="indent" v-model="hunter.experience" :max="5" />
    <div class="indent">
        <span v-if="hunter?.experience >= 5" class="indent">
            <button @click="levelUp()">Level up</button>
        </span>
        <span v-else class="indent">
            <em>Level {{ hunter?.level }}</em>
        </span>
    </div>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import Track from './Track.vue';

const hunter = useHunter();

const levelUp = () => {
    const h = hunter.value;
    h.experience = 0;
    h.level += 1;
};
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
