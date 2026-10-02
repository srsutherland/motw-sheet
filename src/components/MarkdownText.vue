<template>
<span v-if="inline" class="md" v-html="renderInline(text)"></span>
<div v-else class="md" v-html="render(text)"></div>
</template>

<script setup>
import { render, renderInline } from '@/Markdown';

const props = defineProps({
    text: String,
    inline: Boolean,
});
</script>

<style scoped>
.md :deep(p) {
    margin: 0 0 0.5em;
}

.md :deep(p:last-child) {
    margin-bottom: 0;
}

.md :deep(.term) {
    text-decoration: underline dotted;
}
</style>
