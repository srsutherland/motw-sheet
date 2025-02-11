<template>
<div class="show-move">
    <div>{{ move?.name }}</div>
    <div>{{ move?.description }}</div>
</div>
</template>

<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter,
    move: Object
});

</script>