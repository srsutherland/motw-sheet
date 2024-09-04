<template>
    <h1 class="hunter-name">
        <input v-model="hunter.name" placeholder="Name"/>
        {{ hunter?.playbook_name }}
    </h1>
    <section>
        <p>Ratings, pick one:</p>
        <select v-model="hunter.ratings">
            <option v-for="rating in hunter.playbook.ratings" :key="rating" :value="rating">
                {{ fomatRating(rating) }}
            </option>
        </select>
    </section>
    <button @click="$emit('change-view', 'show', hunter)">Save</button>
</template>

<script setup>
import { Hunter } from '@/Hunter';

const props = defineProps({
    hunter: Hunter
});

if (!props.hunter) {
    console.error('No hunter provided');
}

const emit = defineEmits(['change-view']);

const plusOrEqualsOrNothing = (value) => {
    return value > 0 ? '+' : value === 0 ? '=' : '';
};

const fomatRating = (rating) => {
    /*
    {
      "Charm": -1,
      "Cool": 1,
      "Sharp": 1,
      "Tough": 0,
      "Weird": 2
    }
      =>
    Charm-1, Cool+1, Sharp+1, Tough=0, Weird+2
    */
    return Object.entries(rating)
        .map(([key, value]) => `${key}${plusOrEqualsOrNothing(value)}${value}`)
        .join(', ');
};
</script>

<style scoped>
.hunter-name input {
    /* same as h1 */
    font-size: 1.3em;
    font-weight: 400;
    margin: 0;
    padding: 5px;
    text-align: right;
    background-color: unset;
    /* only border-bottom */
    border: none;
    border-bottom: 3px solid gray;
    width: 50%;
    min-width: 5em;
}

button {
    margin: 1em 0;
    padding: 0.5em 1em;
    border: 1px solid var(--color-button-border);
    border-radius: 5px;
    background-color: var(--color-button-background);
    cursor: pointer;
    box-shadow: 0 0 5px 5px rgba(255, 0, 255, 0.1);
}
    
</style>