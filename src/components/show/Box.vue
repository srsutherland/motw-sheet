<template>
    <span>{{ filled ? '■' : '□' }}</span>
    <!--▣-->
</template>

<script setup>
const props = defineProps({
    filled: Boolean
});
</script>
