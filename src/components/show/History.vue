<template>
<section class="show-history">
    <h2>History</h2>
    <p v-if="!hunter.history.length"><em>No history yet.</em></p>
    <ul>
        <li v-for="(entry, i) in hunter.history" :key="i">
            <strong>{{ entry.name || '<Someone>' }}</strong>: {{ entry.option }}
            <div v-if="entry.notes" class="notes">{{ entry.notes }}</div>
        </li>
    </ul>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';

const hunter = useHunter();
</script>

<style scoped>
.notes {
    opacity: 0.8;
    font-style: italic;
}
</style>
