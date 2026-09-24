<template>
<section class="show-experience">
    <span class="heading">Experience</span>:
    <div class="indent">
        <BoxButton minus @click="changeExperience(-1)" />
        <span v-for="i in 5" :key="i">
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
import { useHunter } from '@/HunterContext';
import Box from './Box.vue';
import BoxButton from './BoxButton.vue';

const hunter = useHunter();

const changeExperience = (amount) => {
    const h = hunter.value;
    h.experience += amount;
    if (h.experience < 0) {
        h.experience = 0;
    }
    if (h.experience > 5) {
        h.experience = 5;
    }
};

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