<template>
<section class="show-experience">
    <span class="heading">Experience</span>:
    <Track class="indent" v-model="hunter.experience" :max="5" @below-min="levelDown">
        <template #after-plus>
            <button v-if="hunter.experience >= 5" class="level-up" @click="levelUp">
                Level Up
            </button>
        </template>
    </Track>
    <div class="indent">
        <span class="indent">
            <em>Level {{ hunter.level }}</em>
            <AdvancementButton />
        </span>
    </div>
</section>
</template>

<script setup>
// Experience: Level Up at 5; - at 0 levels down (after confirming). Improvements are taken
// separately, through Advancement, so leveling up mid-session never blocks the sheet.
import { useHunter } from '@/HunterContext';
import { improvementBudget, takenImprovements } from '@/HunterState';
import AdvancementButton from '../AdvancementButton.vue';
import Track from './Track.vue';

const hunter = useHunter();

const levelUp = () => {
    const h = hunter.value;
    h.level += 1;
    h.experience = 0;
};

const levelDown = () => {
    const h = hunter.value;
    if (h.level <= 0) {
        return;
    }
    // how many improvements the lower level would leave unpaid for
    const lower = { ...h, level: h.level - 1, improvements: takenImprovements(h) };
    const disabling = improvementBudget(lower).disabled.size - improvementBudget(h).disabled.size;
    const plural = disabling > 1 ? 's' : '';
    const warning = disabling > 0
        ? `\n\n${disabling} improvement${plural} will be disabled (choices kept) until you level up again.`
        : '';
    if (confirm(`Level down to level ${h.level - 1}?${warning}`)) {
        h.level -= 1;
        h.experience = 4;
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

.level-up {
    margin-left: 0.5em;
}
</style>
