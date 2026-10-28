<template>
<section class="view-luck">
    <!-- the playbook's luck special pops up from the heading -->
    <HoverPopup v-if="hunter.playbook.luck.special">
        <template #trigger><span class="heading">Luck</span></template>
        <MarkdownText class="special" :text="hunter.playbook.luck.special" />
    </HoverPopup>
    <span v-else class="heading">Luck</span>:
    <Track
        class="indent"
        v-model="hunter.luck_used"
        :max="hunter.luck_max"
        start="Okay"
        end="Doomed"
    />
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import HoverPopup from '../shared/HoverPopup.vue';
import MarkdownText from '../shared/MarkdownText.vue';
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
