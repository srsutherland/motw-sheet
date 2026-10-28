<template>
<section id="gear">
    <fieldset>
        <legend>Starting Gear</legend>
        <MarkdownText :text="startingGear?.description" />
        <GettingStartedChoices :from="`${hunter.playbook.id}.starting_gear`" />
    </fieldset>
    <fieldset>
        <legend>Other Gear</legend>
        <ul class="plain">
            <li v-for="(item, i) in hunter.extra_gear" :key="i">
                <input v-model="item.name" placeholder="name" />
                <input
                    :value="item.tags.join(' ')"
                    placeholder="tags, e.g. 1-harm close"
                    @change="item.tags = parseTags($event.target.value)"
                />
                <button class="small" title="Remove" @click="hunter.extra_gear.splice(i, 1)">
                    ✕
                </button>
            </li>
        </ul>
        <button class="small" @click="hunter.extra_gear.push({ name: '', tags: [] })">
            Add gear
        </button>
    </fieldset>
</section>
</template>

<script setup>
// Starting gear (picked from the playbook), then gear added during play
import { computed } from 'vue';
import { useHunter } from '@/HunterContext';
import { parseTags } from '@/Tags';
import MarkdownText from '../shared/MarkdownText.vue';
import GettingStartedChoices from './GettingStartedChoices.vue';

const hunter = useHunter();

const startingGear = computed(() => hunter.value.playbook.starting_gear);
</script>

<style scoped>
ul.plain {
    list-style: none;
    padding-left: 0;
}
</style>
