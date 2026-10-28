<template>
<section id="history">
    <fieldset>
        <legend>History</legend>
        <MarkdownText :text="hunter.playbook.history.description" />
        <div v-for="(entry, i) in hunter.history" :key="i" class="history-entry">
            <input v-model="entry.name" placeholder="other hunter's name" />
            <select @change="entry.option = $event.target.value; $event.target.value = ''">
                <option value="">pick from the playbook…</option>
                <option
                    v-for="option in hunter.playbook.history.options"
                    :key="option"
                    :value="option"
                >
                    {{ option }}
                </option>
            </select>
            <textarea v-model="entry.option" placeholder="how you know them" rows="2"></textarea>
            <textarea v-model="entry.notes" placeholder="notes" rows="1"></textarea>
            <button class="small" @click="hunter.history.splice(i, 1)" title="Remove">✕</button>
        </div>
        <button class="small" @click="hunter.history.push({ name: '', option: '', notes: '' })">
            Add a hunter
        </button>
    </fieldset>
</section>
</template>

<script setup>
// How the hunter knows each other hunter: a playbook option as a pre-fill, edited freely
import { useHunter } from '@/HunterContext';
import MarkdownText from '../shared/MarkdownText.vue';

const hunter = useHunter();
</script>

<style scoped>
.history-entry {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
    align-items: flex-start;
    margin: 0.5em 0;
}

.history-entry select {
    max-width: 12em;
}

.history-entry textarea {
    min-width: 15em;
}
</style>
