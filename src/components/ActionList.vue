<template>
<section id="main">
    <button @click="$emit('change-view', 'new')">New Playbook</button>
    <label class="button">
        Import Hunter
        <input type="file" accept=".json,application/json" @change="onImport" hidden />
    </label>
</section>
<section id="hunters" v-if="hunters.length">
    <h2>Hunters</h2>
    <ul>
        <li v-for="entry in hunters" :key="entry.uid">
            <span v-if="entry.outdated" title="Saved by an older version of the app">
                {{ entry.label }} (old format)
            </span>
            <a
                v-else
                :href="`?view=${entry.uid}`"
                @click.prevent="$emit('change-view', 'show', entry.hunter)"
            >
                {{ entry.hunter.playbook?.emoji }} {{ entry.hunter.toString() }}
            </a>
            <button @click="onDelete(entry)" title="Delete">🗑</button>
        </li>
    </ul>
</section>
</template>

<script setup>
import { ref } from 'vue';
import { listHunters, deleteHunter, importHunter } from '@/Storage';

const emit = defineEmits(['change-view']);

const hunters = ref(listHunters());

const onDelete = (entry) => {
    const label = entry.hunter?.toString() ?? entry.label;
    if (confirm(`Delete ${label}? This can't be undone.`)) {
        deleteHunter(entry.uid);
        hunters.value = listHunters();
    }
};

const onImport = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
        const hunter = await importHunter(file);
        if (hunter) {
            emit('change-view', 'show', hunter);
        }
    } catch (e) {
        alert(`Couldn't import ${file.name}: ${e.message}`);
    }
};
</script>

<style scoped>
section {
    max-width: 50em;
    margin: 0 auto;
    padding: 1em;
}

section#main {
    display: flex;
    justify-content: center;
    gap: 1em;
}

button, .button {
    padding: 0.5em 1em;
    border: 1px solid var(--color-button-border);
    border-radius: 5px;
    background-color: var(--color-button-background);
    cursor: pointer;
    font: inherit;
    font-size: 0.8em;
}

li {
    margin: 0.5em 0;
}

li button {
    margin-left: 0.5em;
    padding: 0 0.3em;
}
</style>
