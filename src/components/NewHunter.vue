<template>
<PlaybookList @select-playbook="newHunter" />
</template>

<script setup>
import PlaybookList from './PlaybookList.vue';
import { Hunter } from '@/Hunter';

const emit = defineEmits(['change-view']);

const newHunter = (pb) => {
    const hunter = new Hunter(pb);
    emit('change-view', 'edit', hunter);
};
</script>
