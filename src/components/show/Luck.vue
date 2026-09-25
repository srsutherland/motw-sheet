<template>
<section class="show-luck">
    <span class="heading">Luck</span>:
    <Track
        class="indent"
        v-model="hunter.luck"
        :max="hunter.luck_max"
        start="Okay"
        end="Doomed"
    />
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import Track from './Track.vue';

const hunter = useHunter();
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
