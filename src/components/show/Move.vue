<template>
<div class="show-move">
    <span class="move-name">{{ move?.name }}: </span>
    <span>{{ move?.description }}</span>
    <div v-if="move?.children?.length">
        <ul>
            <li v-for="child in move.children" :key="child.name">
                <span class="move-name">{{ child.name }}: </span>
                <span>{{ child.description }}</span>
            </li>
        </ul>
    </div>
    <div v-if="move?.choices?.length">
        <ul>
            <li v-for="choice in move.choices" :key="choice">
                <span>{{ choice }}</span>
            </li>
        </ul>
    </div>
</div>
</template>

<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter,
    move: Object
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