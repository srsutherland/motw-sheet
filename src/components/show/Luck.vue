<template>
<section class="show-luck">
    <span class="heading">Luck</span>:
    <div class="indent">
        <em>Okay</em>
        <BoxButton minus @click="changeLuck(-1)" />
        <span v-for="i in hunter?.luck_max" :key="i">
            <Box filled v-if="hunter?.luck >= i"/>
            <Box v-else/>
        </span>
        <BoxButton plus @click="changeLuck(1)" />
        <em>Doomed</em>
    </div>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const hunter = useHunter();

const changeLuck = (amount) => {
    const h = hunter.value;
    h.luck += amount;
    if (h.luck < 0) {
        h.luck = 0;
    }
    if (h.luck > h.luck_max) {
        h.luck = h.luck_max;
    }
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