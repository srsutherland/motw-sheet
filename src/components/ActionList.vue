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
        <li v-for="h in hunters" :key="h.uid">
            <a :href="`?view=${h.uid}`" @click.prevent="$emit('change-view', 'show', h)">
                {{ h.playbook?.emoji }} {{ h.toString() }}
            </a>
            <button @click="onDelete(h)" title="Delete">🗑</button>
        </li>
    </ul>
</section>
</template>

<script setup>
import { ref } from 'vue';
import { listHunters, deleteHunter, importHunter } from '@/Storage';

const emit = defineEmits(['change-view']);

const hunters = ref(listHunters());

const onDelete = (h) => {
    if (confirm(`Delete ${h.toString()}? This can't be undone.`)) {
        deleteHunter(h.uid);
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
