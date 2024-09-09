<template>
<section>
    <span class="heading">Luck</span>:
    <div class="indent">
        <em>Okay</em>
        <button @click="changeLuck(-1)">-</button>
        <span v-for="i in hunter?.luck_max">
            <Box filled v-if="hunter?.luck >= i"/>
            <Box v-else/>
        </span>
        <button @click="changeLuck(1)">+</button>
        <em>Doomed</em>
    </div>
</section>
</template>

<script setup>
import { Hunter } from '@/Hunter';
import Box from './Box.vue';

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

button {
    padding: 0;
    width: 1em;
    height: 1em;
    border-radius: 1em;
}

.heading {
    font-weight: bold;
    /* all caps */
    text-transform: uppercase;
}
</style>