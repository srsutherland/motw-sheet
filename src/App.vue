<script setup>
import PlaybookList from './components/PlaybookList.vue';
</script>

<template>
  <header>
    <h1>MOTW App</h1>
  </header>

  <main>
    <PlaybookList />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border);
}

header h1 {
  text-align: center;
  margin: 0;
  padding: 5px;
  font-size: 2rem;
  font-weight: 400;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
