<template>
<ul v-if="details?.length" class="move-details">
    <!-- { name, description } (Could've Been Worse), or plain text (Dark Past) -->
    <li v-for="(detail, i) in details" :key="i">
        <MarkdownText v-if="typeof detail === 'string'" :text="detail" inline />
        <template v-else>
            <strong>{{ detail.name }}: </strong>
            <MarkdownText :text="detail.description" inline />
        </template>
    </li>
</ul>
</template>

<script setup>
// A move's display-only sub-items, chosen during play rather than when building the hunter
import MarkdownText from '../MarkdownText.vue';

const props = defineProps({
    details: Array,
});
</script>
