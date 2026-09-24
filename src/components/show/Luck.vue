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
import { Hunter } from '@/Hunter';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const changeLuck = (amount) => {
    props.hunter.luck += amount;
    if (props.hunter.luck < 0) {
        props.hunter.luck = 0;
    }
    if (props.hunter.luck > props.hunter.luck_max) {
        props.hunter.luck = props.hunter.luck_max;
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