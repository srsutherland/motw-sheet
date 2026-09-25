<template>
    <button :class="{plus: plus, minus: minus}">
        <span v-if="plus">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <!-- vertically-centered plus -->
                <line x1="50%" y1="10%" x2="50%" y2="90%" />
                <line x1="10%" y1="50%" x2="90%" y2="50%" />
            </svg>
        </span>
        <span v-else-if="minus">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <!-- vertically-centered minus -->
                <line x1="10%" y1="50%" x2="90%" y2="50%" />
            </svg>
        </span>
        <span v-else>?</span>
    </button>
</template>

<script setup>
const props = defineProps({
    plus: Boolean,
    minus: Boolean
});
</script>

<style scoped>
button {
    padding: 0;
    width: 1em;
    height: 1em;
    line-height: 1em;
    border-radius: 1em;
    display: table-cell;
    vertical-align: middle;
}

svg {
    width: 1em;
    height: 1em;
    stroke: white;
    stroke-width: 10;
    fill: none;
}

button.plus {
    margin-right: 0.5em;
}

button.minus {
    margin-left: 0.5em;
}

</style>