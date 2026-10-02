<template>
<div class="show-move">
    <span class="move-name">{{ move?.name }}: </span>
    <MarkdownText :text="move?.description" inline />
    <ul v-if="move?.details?.length">
        <li v-for="detail in move.details" :key="detail.name">
            <span class="move-name">{{ detail.name }}: </span>
            <MarkdownText :text="detail.description" inline />
        </li>
    </ul>
</div>
</template>

<script setup>
import MarkdownText from '../MarkdownText.vue';

const props = defineProps({
    move: Object,
    path: String,
});
</script>

<style scoped>
.show-move {
    margin-bottom: 1em;
    max-width: 40em;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.move-name {
    font-weight: bold;
}
</style>
