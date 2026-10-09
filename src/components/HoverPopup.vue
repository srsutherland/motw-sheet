<template>
<span class="popup-anchor" @mouseenter="hovering = true" @mouseleave="hovering = false">
    <button type="button" class="popup-trigger" :aria-expanded="open" @click="pinned = !pinned">
        <slot name="trigger"></slot>
    </button>
    <div v-if="open" class="popup" role="tooltip">
        <slot></slot>
    </div>
</span>
</template>

<script setup>
// A popup that shows on hover, and stays open when clicked (touch screens have no hover).
import { computed, ref } from 'vue';

const hovering = ref(false);
const pinned = ref(false);
const open = computed(() => hovering.value || pinned.value);
</script>

<style scoped>
.popup-anchor {
    position: relative;
    display: inline-block;
}

.popup-trigger {
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: help;
    text-decoration: underline dotted;
}

.popup {
    position: absolute;
    z-index: 10;
    top: 100%;
    left: 0;
    width: 25em;
    max-width: 80vw;
    padding: 0.5em 0.75em;
    border: 1px solid var(--color-button-border);
    border-radius: 5px;
    background-color: var(--color-dialog-background, white);
    font-weight: normal;
    text-transform: none;
}
</style>
