<template>
<section id="edit-ratings">
    <fieldset>
        <legend>{{ hunter.playbook.ratings_base.heading ?? 'Ratings, pick one line:' }}</legend>
        <div v-for="(rating, i) in hunter.playbook.ratings_base.options" :key="i">
            <label>
                <input
                    type="radio"
                    :value="rating"
                    v-model="hunter.ratings_base"
                />
                <span v-html="ratingLineHtml(rating)"></span>
            </label>
        </div>
    </fieldset>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import { ratingLineHtml } from '@/Format';

const hunter = useHunter();
</script>
