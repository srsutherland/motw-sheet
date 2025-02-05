<template>
<section>
    <span class="heading">Gear</span>:
    <div class="indent">
        <ul>
            <li v-for="gear in hunter?.gear" :key="gear.name">
                <span>
                    {{ gear.name }}
                </span>
                (<span v-for="tag in gear.tags" :key="tag">
                    {{ tag }}{{ " " }}
                </span>)
            </li>
        </ul>
    </div>
</section>
</template>

<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}
</script>

<style scoped>
.heading {
    font-weight: bold;
    /* all caps */
    text-transform: uppercase;
}

ul {
    margin: 0;
}
</style>