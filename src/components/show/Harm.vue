<template>
<section class="show-harm">
    <div class="heading">Harm:</div>
    <div class="indent">
        <em>Okay</em>
        <BoxButton minus @click="changeHarm(-1)" />
        <span v-for="i in hunter?.harm_max" :key="i">
            <span v-if="i === hunter?.harm_unstable">|</span>
            <Box filled v-if="hunter?.harm >= i"/>
            <Box v-else/>
        </span>
        <BoxButton plus @click="changeHarm(1)" />
        <em>Dying</em>
    </div>
    <div class="indent">
        <span class="indent">
            Unstable:
            <Box filled v-if="hunter?.unstable"/>
            <Box v-else/>
        </span>
    </div>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const hunter = useHunter();

const changeHarm = (amount) => {
    const h = hunter.value;
    h.harm += amount;
    if (h.harm < 0) {
        h.harm = 0;
    }
    if (h.harm > h.harm_max) {
        h.harm = h.harm_max;
    }
    if (amount < 0) {
        h.unstable = false;
    }
    else if (h.harm >= h.harm_unstable) {
        h.unstable = true;
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