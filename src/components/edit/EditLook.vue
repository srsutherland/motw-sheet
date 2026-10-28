<template>
<section id="look">
    <fieldset>
        <legend>Look</legend>
        <p v-if="hunter.playbook.look.heading">{{ hunter.playbook.look.heading }}</p>
        <div v-for="(list, key) in lookLists" :key="key" class="look-list">
            <span class="format">{{ list.format }}:</span>
            <label v-for="option in list.options.filter((o) => o !== TEXTBOX)" :key="option">
                <input
                    type="radio"
                    :name="`look-${key}`"
                    :value="option"
                    v-model="hunter.look[key]"
                />
                {{ option }}
            </label>
            <label v-if="list.options.includes(TEXTBOX)">
                <input
                    type="radio"
                    :name="`look-${key}`"
                    :checked="isCustomLook(key, list)"
                    @change="pickCustomLook(key, list, $event)"
                />
                <input
                    class="textbox"
                    placeholder="write your own"
                    :value="lookText(key, list)"
                    @change="setCustomLook(key, $event.target.value)"
                />
            </label>
        </div>
    </fieldset>
</section>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useHunter } from '@/HunterContext';
import { TEXTBOX } from '@/PlaybookData';

const hunter = useHunter();

// look: { heading, clothes: { format, options }, eyes: {...} }
const lookLists = computed(() => Object.fromEntries(Object.entries(hunter.value.playbook.look)
    .filter(([key]) => key !== 'heading')));

// Look: what was typed into "write your own", kept while a listed option is picked
const customLook = reactive({});
const isCustomLook = (key, list) => !!hunter.value.look[key]
    && !list.options.includes(hunter.value.look[key]);
const lookText = (key, list) => customLook[`${hunter.value.uid}.${key}`]
    ?? (isCustomLook(key, list) ? hunter.value.look[key] : '');
const setCustomLook = (key, text) => {
    customLook[`${hunter.value.uid}.${key}`] = text.trim();
    hunter.value.look[key] = text.trim();
};
const pickCustomLook = (key, list, event) => {
    const text = lookText(key, list);
    hunter.value.look[key] = text;
    event.target.nextElementSibling.focus();
};
</script>

<style scoped>
.look-list {
    margin: 0.5em 0;
}

.look-list label {
    margin-right: 1em;
}

.format {
    opacity: 0.7;
    margin-right: 0.5em;
}

.textbox {
    width: 10em;
}
</style>
