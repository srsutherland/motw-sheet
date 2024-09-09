<template>
    <span v-if="!filled">
        □
    </span>
    <span v-if="filled">
        ■
    </span>
    <!--▣-->
</template>

<script setup>
const props = defineProps({
    filled: Boolean
});
</script>