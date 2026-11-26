<template>
<section id="look">
    <fieldset>
        <legend>Look</legend>
        <p v-if="hunter.playbook.look.heading">{{ hunter.playbook.look.heading }}</p>
        <div v-for="trait in hunter.playbook.look.options" :key="trait.id" class="look-list">
            <span class="format">{{ trait.format }}:</span>
            <label v-for="option in trait.options.filter((o) => o !== TEXTBOX)" :key="option">
                <input
                    type="radio"
                    :name="`look-${trait.id}`"
                    :value="option"
                    v-model="hunter.look[trait.id]"
                />
                {{ option }}
            </label>
            <label v-if="trait.options.includes(TEXTBOX)">
                <input
                    type="radio"
                    :name="`look-${trait.id}`"
                    :checked="isCustomLook(trait)"
                    @change="pickCustomLook(trait, $event)"
                />
                <input
                    class="textbox"
                    placeholder="write your own"
                    :value="lookText(trait)"
                    @change="setCustomLook(trait, $event.target.value)"
                />
            </label>
        </div>
    </fieldset>
</section>
</template>

<script setup>
import { reactive } from 'vue';
import { useHunter } from '@/HunterContext';
import { TEXTBOX } from '@/PlaybookData';

const hunter = useHunter();

// Look: what was typed into "write your own", kept while a listed option is picked
const customLook = reactive({});
const isCustomLook = (trait) => !!hunter.value.look[trait.id]
    && !trait.options.includes(hunter.value.look[trait.id]);
const lookText = (trait) => customLook[`${hunter.value.uid}.${trait.id}`]
    ?? (isCustomLook(trait) ? hunter.value.look[trait.id] : '');
const setCustomLook = (trait, text) => {
    customLook[`${hunter.value.uid}.${trait.id}`] = text.trim();
    hunter.value.look[trait.id] = text.trim();
};
const pickCustomLook = (trait, event) => {
    hunter.value.look[trait.id] = lookText(trait);
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
