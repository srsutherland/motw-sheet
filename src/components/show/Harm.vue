<template>
<section>
    <div class="heading">Harm:</div>
    <div class="indent">
        <em>Okay</em>
        <BoxButton minus @click="changeHarm(-1)" />
        <span v-for="i in hunter?.harm_max">
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
import { Hunter } from '@/Hunter';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const changeHarm = (amount) => {
    props.hunter.harm += amount;
    if (props.hunter.harm < 0) {
        props.hunter.harm = 0;
    }
    if (props.hunter.harm > props.hunter.harm_max) {
        props.hunter.harm = props.hunter.harm_max;
    }
    if (amount < 0) {
        props.hunter.unstable = false;
    }
    else if (props.hunter.harm >= props.hunter.harm_unstable) {
        props.hunter.unstable = true;
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