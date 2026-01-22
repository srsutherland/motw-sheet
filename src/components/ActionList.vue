<template>
    <section id="main">
        <button @click="$emit('change-view', 'new')">New Playbook</button>
    </section>
</template>

<script setup>
defineEmits(['change-view']);
</script>

<style scoped>
section#main {
    max-width: 50em;
    margin: 0 auto;
    padding: 1em;
    display: flex;
    justify-content: center;
}
</style>