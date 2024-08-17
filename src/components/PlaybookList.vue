<script setup>
import PlaybookListItem from './PlaybookListItem.vue'
import { playbooks } from '@/Playbooks';
globalThis.playbooks = playbooks;
</script>

<template>
  <section>
    <h2>Playbooks</h2>
    <ul>
      <PlaybookListItem v-for="playbook in playbooks" :key="playbook.id" :pb="playbook" />
    </ul>
  </section>
</template>