<template>
    <li>
        <div 
            class="select-button"
            :data-playbook=pb.name 
            :id=pb.id
            @click="$parent.$emit('select-playbook', pb)"
        >
            <h3>{{ pb.emoji }} {{ pb.name }}</h3>
            <div class="subtitle" v-html="pb.quote"></div>
        </div>
    </li>
</template>

<script setup>
const props = defineProps({
    pb: {
        type: Object,
        default: () => ({
            id: "the-error",
            name: "The Error",
            emoji: "🚨",
            quote: "Something went wrong."
        })
    }
});
</script>

<style scoped>
li {
    list-style: none;
    margin: 1em 0;
}

h3 {
    margin: 0;
    margin-bottom: .5em;
}

div.select-button {
    display: flex;
    align-items: center;
    padding: 1em;
    margin: 0;
    border-radius: 5px;
    border: 1px solid var(--color-button-border);
    background-color: var(--color-button-background);
    cursor: pointer;
    box-shadow: 0 0 5px 5px rgba(255, 0, 255, 0.1);
}

div.select-button:hover {
    background-color: var(--color-button-border);
}

.select-button h3 {
    margin: 0;
    margin-right: 10px;
}

.select-button img {
    width: 20px;
    height: 20px;
}

.select-button .subtitle {
    font-size: 0.8em;
    margin: 3px 5px;
    font-style: italic;
}
</style>