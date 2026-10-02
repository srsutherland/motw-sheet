<template>
<section class="show-gear">
    <span class="heading">Gear</span>:
    <div class="indent">
        <ul>
            <li v-for="(gear, i) in allGear" :key="i">
                <span>
                    {{ gear.name }}
                </span>
                <span v-if="gear.tags?.length">({{ gear.tags.join(' ') }})</span>
            </li>
        </ul>
    </div>
</section>
</template>

<script setup>
import { computed } from 'vue';
import { useHunter, useHunterState } from '@/HunterContext';

const hunter = useHunter();
const state = useHunterState();

// Starting gear, then gear added during play
const allGear = computed(() => [
    ...state.value.gear.map((item) => item.node),
    ...hunter.value.extra_gear,
]);
</script>

<style scoped>
.heading {
    font-weight: bold;
    /* all caps */
    text-transform: uppercase;
}

ul {
    margin: 0;
}
</style>
