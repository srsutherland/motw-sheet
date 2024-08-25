<template>
    <section>
        <button @click="$emit('change-view', 'new')">New Playbook</button>
    </section>
</template>

<script setup>
defineEmits(['change-view']);
</script>