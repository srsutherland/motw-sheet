<template>
<section class="show-experience">
    <span class="heading">Experience</span>:
    <div class="indent">
        <BoxButton minus @click="changeExperience(-1)" />
        <span v-for="i in 5">
            <Box filled v-if="hunter?.experience >= i"/>
            <Box v-else/>
        </span>
        <BoxButton plus @click="changeExperience(1)" />
    </div>
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
import { Hunter } from '@/Hunter';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const changeExperience = (amount) => {
    props.hunter.experience += amount;
    if (props.hunter.experience < 0) {
        props.hunter.experience = 0;
    }
    if (props.hunter.experience > 5) {
        props.hunter.experience = 5;
    }
};

const levelUp = () => {
    props.hunter.experience = 0;
    props.hunter.level += 1;
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