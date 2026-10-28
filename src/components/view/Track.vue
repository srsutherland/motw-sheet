<template>
<div class="track">
    <em v-if="start">{{ start }}</em>
    <TrackButton minus @click="change(-1)" />
    <span v-for="i in max" :key="i">
        <span v-if="i === dividerAt">|</span>
        <TrackBox :filled="model >= i" />
    </span>
    <TrackButton plus @click="change(1)" />
    <!-- right after the + button, e.g. Level Up -->
    <slot name="after-plus"></slot>
    <em v-if="end">{{ end }}</em>
</div>
</template>

<script setup>
// A row of boxes with -/+ buttons, e.g. luck, harm, experience.
// Knows nothing about hunters; the wrapper component supplies the value and any rules.
// Pressing - when empty emits `below-min` (experience uses it to level down).
import TrackBox from './TrackBox.vue';
import TrackButton from './TrackButton.vue';

const model = defineModel({ type: Number, required: true });

const props = defineProps({
    max: { type: Number, required: true },
    start: String,      // label before the boxes
    end: String,        // label after the boxes
    dividerAt: Number,  // draw a divider before this box
});

const emit = defineEmits(['below-min']);

const change = (amount) => {
    if (amount < 0 && model.value <= 0) {
        emit('below-min');
        return;
    }
    model.value = Math.min(Math.max(model.value + amount, 0), props.max);
};
</script>
