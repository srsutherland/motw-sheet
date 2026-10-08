<template>
<dialog ref="dialog" class="improvement-picker" @cancel.prevent="cancel">
    <h2>{{ levelUp ? 'Level up' : 'Take an improvement' }}</h2>
    <MarkdownText
        v-if="levelUp && hunter.playbook.leveling_up"
        :text="hunter.playbook.leveling_up.description"
    />

    <template v-if="pendingIndex < 0">
        <section v-for="{ key, list, unlocked } in lists" :key="key">
            <h3>{{ listNames[key] }}</h3>
            <MarkdownText
                v-if="list.description && key !== 'improvements'"
                class="list-description"
                :text="list.description"
            />
            <p v-if="key === 'improvements_mythic'" class="note">
                Homebrew: not on the paper playbook.
            </p>
            <p v-if="!unlocked" class="note">Not unlocked yet.</p>
            <ul v-else>
                <li v-for="improvement in list.options" :key="improvement.id">
                    <button
                        class="option"
                        :disabled="!!blocked(improvement)"
                        @click="choose(improvement)"
                    >
                        <MarkdownText :text="improvement.description" inline />
                    </button>
                    <span v-if="blocked(improvement)" class="note">
                        ({{ blocked(improvement) }})
                    </span>
                </li>
            </ul>
        </section>
        <button v-if="levelUp" @click="skip">Skip: level up, take an improvement later</button>
        <button @click="cancel">Cancel</button>
    </template>

    <template v-else>
        <p><strong><MarkdownText :text="pending.description" inline /></strong></p>
        <p v-if="pending.special" class="note">
            Recorded on your sheet; work out the details with your Keeper.
        </p>
        <ChooseRule
            v-for="(rule, i) in asList(pending.choose)"
            :key="i"
            :rule="rule"
            :self="pending"
            :set="choiceSet(hunter.improvements[pendingIndex], pending, i)"
        />
        <p v-if="!complete" class="note">
            Not every choice is made yet; you can finish them later on the edit page.
        </p>
        <button @click="confirm">Take it</button>
        <button @click="back">Back</button>
    </template>
</dialog>
</template>

<script setup>
// Pick an improvement: on level up, or to spend an unspent one.
// The improvement being picked is added to the hunter right away (marked pending),
// so its choices are stored like any other and previewed live on the sheet.
import { computed, onMounted, ref } from 'vue';
import { asList, makeChoose } from '@/Hunter';
import { useHunter, useHunterState } from '@/HunterContext';
import {
    applyOneOffEffects, choiceSet, costOf, countOf, findImprovement, improvementBlocked,
    improvementLists, unspentImprovements,
} from '@/HunterState';
import ChooseRule from './ChooseRule.vue';
import MarkdownText from './MarkdownText.vue';

const props = defineProps({
    levelUp: Boolean, // true: this improvement comes with a new level
});
const emit = defineEmits(['done']);

const hunter = useHunter();
const state = useHunterState();
const dialog = ref(null);

onMounted(() => dialog.value.showModal());

const listNames = {
    improvements: 'Improvements',
    improvements_advanced: 'Advanced Improvements',
    improvements_mythic: 'Mythic Improvements',
};

// Level ups completed before the one this improvement is for (advanced: "after you have
// leveled up five times").
const levelsBefore = computed(() => {
    const h = hunter.value;
    return props.levelUp ? h.level : h.level - unspentImprovements(h);
});

const lists = computed(() => improvementLists(hunter.value, levelsBefore.value));
// Improvements available to spend, counting the one this level up earns
const points = computed(() => unspentImprovements(hunter.value) + (props.levelUp ? 1 : 0));
const blocked = (improvement) => improvementBlocked(
    hunter.value, improvement, state.value, points.value,
);

const pendingIndex = computed(() => hunter.value.improvements.findIndex((taken) => taken.pending));
const pending = computed(() => {
    const taken = hunter.value.improvements[pendingIndex.value];
    return taken ? findImprovement(hunter.value.playbook, taken.id)?.improvement : null;
});

const complete = computed(() => asList(pending.value?.choose).every((rule, i) => {
    const set = choiceSet(hunter.value.improvements[pendingIndex.value], pending.value, i);
    return (set?.choices ?? []).length >= (rule.min ?? countOf(rule));
}));

const choose = (improvement) => {
    const cost = costOf(hunter.value.playbook, improvement.id);
    hunter.value.improvements.push({
        id: improvement.id,
        ...(cost > 1 ? { cost } : {}),
        choose: makeChoose(improvement),
        pending: true,
    });
};

const back = () => {
    hunter.value.improvements.splice(pendingIndex.value, 1);
};

const confirm = () => {
    const h = hunter.value;
    const improvement = pending.value;
    delete h.improvements[pendingIndex.value].pending;
    applyOneOffEffects(h, improvement);
    if (props.levelUp) {
        h.level += 1;
        h.experience = 0;
    }
    close();
};

// Level up without taking an improvement; it stays unspent (e.g. to save for a mythic one)
const skip = () => {
    const h = hunter.value;
    h.level += 1;
    h.experience = 0;
    close();
};

const cancel = () => {
    if (pendingIndex.value >= 0) {
        back();
    }
    close();
};

const close = () => {
    dialog.value.close();
    emit('done');
};
</script>

<style scoped>
.improvement-picker {
    max-width: 40em;
    max-height: 90vh;
    overflow-y: auto;
    background-color: var(--color-dialog-background, white);
    color: inherit;
}

ul {
    list-style: none;
    padding-left: 0;
}

li {
    margin: 0.25em 0;
}

button {
    margin: 0.5em 0.5em 0 0;
    cursor: pointer;
}

button.option {
    text-align: left;
    margin: 0;
}

.note {
    opacity: 0.7;
    font-size: 0.9em;
}
</style>
