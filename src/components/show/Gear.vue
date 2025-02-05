<template>
<section>
    <span class="heading">Gear</span>:
    <div class="indent">
        <ul>
            <li v-for="item in hunter?.gear" :key="item.name">
                {{ item.name }}
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