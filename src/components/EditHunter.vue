<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter
});
</script>

<template>
    <p>EDITING {{ hunter?.name || "NoName" }} {{ hunter?.playbook_name }}</p>
</template>