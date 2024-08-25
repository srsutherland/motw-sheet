<template>
    <p>EDITING {{ hunter?.name || "NoName" }} {{ hunter?.playbook_name }}</p>
</template>

<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter
});
</script>