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

<!--
<div data-playbook="${name}" class="select-button" id="${pb.id}">
    <div>
        <h3>${pb.emoji} ${name}</h3>
        <div class="subtitle">${pb.quote}</div>
    </div>
</div>
-->
<template>
    <li>
        <div :data-playbook=pb.name class="select-button" :id=pb.id>
            <h3>{{ pb.emoji }} {{ pb.name }}</h3>
            <div class="subtitle" v-html="pb.quote"></div>
        </div>
    </li>
</template>