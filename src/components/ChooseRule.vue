<template>
<div class="choose-rule">
    <p class="status" :class="{ unmet: remaining > 0 || unmetLimits.length }">
        {{ verbLabel }} {{ count }}<span v-if="remaining > 0"> ({{ remaining }} left)</span>
        <span v-for="limit in unmetLimits" :key="limit"> · {{ limit }}</span>
    </p>
    <div v-for="group in groups" :key="group.key" class="group">
        <p v-if="group.name" class="group-name">{{ group.name }}:</p>
        <ul>
            <li v-for="entry in group.entries" :key="entry.key">
                <label
                    :class="{
                        disabled: isDisabled(entry),
                        crossed: verb === 'cross' && isChosen(entry),
                    }"
                >
                    <input
                        v-if="!entry.textbox"
                        type="checkbox"
                        :checked="isChosen(entry)"
                        :disabled="isDisabled(entry)"
                        @change="toggle(entry)"
                    />
                    <input
                        v-else
                        type="text"
                        class="textbox"
                        placeholder="write your own"
                        :value="textOf(entry)"
                        :disabled="isDisabled(entry)"
                        @change="setText(entry, $event.target.value)"
                    />
                    <span v-if="entry.node">
                        <strong v-if="entry.node.name">{{ entry.node.name }}</strong>
                        <span v-if="entry.node.name && entry.node.description">: </span>
                        <MarkdownText :text="entry.node.description" inline />
                        <span v-if="entry.node.tags?.length" class="tags">
                            ({{ entry.node.tags.join(' ') }})
                        </span>
                    </span>
                    <span v-if="takenElsewhere(entry)" class="note">
                        ({{ advancing ? 'already advanced' : 'already have' }})
                    </span>
                    <span v-else-if="atMax(entry)" class="note">(already at max)</span>
                </label>
                <!-- an option with its own choice: Practitioner, Arcane Reputation... -->
                <div v-if="isChosen(entry) && verb === 'pick' && entry.node?.choose" class="nested">
                    <ChooseRule
                        v-for="(nested, i) in asList(entry.node.choose)"
                        :key="i"
                        :rule="nested"
                        :self="entry.node"
                        :set="choiceSet(pickRecord(set, entry.written), entry.node, i)"
                    />
                </div>
            </li>
        </ul>
    </div>
    <p v-if="!entries.length" class="note">Nothing available to choose from yet.</p>
</div>
</template>

<script setup>
// One `choose` rule (plan/Schema Notes.md: "Choosing"): its options, the hunter's
// choices for it, and its limits. Fewer than the full count is always allowed;
// going over a limit needs "bend the rules" (provided by the edit page).
import { computed, inject, ref, toRaw } from 'vue';
import { asList } from '@/Hunter';
import { useHunter, useHunterState } from '@/HunterContext';
import { optionsOf, pathOf, refPath } from '@/PlaybookData';
import {
    advancesBasicMoves, choiceSet, countOf, isText, overMax, pickRecord, refOf, setTextChoice,
    toggleChoice, verbOf,
} from '@/HunterState';
import MarkdownText from './MarkdownText.vue';

const props = defineProps({
    rule: { type: Object, required: true },
    self: Object, // the object the rule is written in, for @this
    set: Object, // the hunter's { from, choices } for this rule (HunterState.js: choiceSet)
});

const hunter = useHunter();
const state = useHunterState();
const bendRules = inject('bendRules', ref(false));

const verb = computed(() => verbOf(props.rule));
const count = computed(() => countOf(props.rule));
const VERB_LABELS = { pick: 'Pick', cross: 'Cross off', remove: 'Remove' };
const verbLabel = computed(() => VERB_LABELS[verb.value]);

// "Mark two basic moves as advanced": picks moves you already have
const advancing = computed(() => advancesBasicMoves(props.self));
const isThisSet = (set) => set === toRaw(props.set);

const containerPath = computed(() => refPath(props.rule.from, hunter.value.playbook, props.self));

// For "remove", the options are the hunter's current picks from the container.
const entries = computed(() => {
    const options = optionsOf(props.rule.from, hunter.value.playbook, props.self);
    if (verb.value === 'remove') {
        const picked = new Set(state.value.picks
            .filter((p) => p.path && p.container === containerPath.value && !isThisSet(p.set))
            .map((p) => p.path));
        return options.filter((entry) => picked.has(entry.path));
    }
    return options;
});

const groups = computed(() => {
    const list = [];
    for (const entry of entries.value) {
        const group = entry.group;
        const key = group ? pathOf(group, hunter.value.playbook) ?? group : '';
        let found = list.find((g) => g.key === key);
        if (!found) {
            found = { key, name: group?.name, node: group, entries: [] };
            list.push(found);
        }
        found.entries.push(entry);
    }
    return list;
});

const chosen = computed(() => props.set?.choices ?? []);
const remaining = computed(() => Math.max(0, count.value - chosen.value.length));

// The nth @textbox option holds the nth free-text choice.
const textboxIndex = (entry) => Number(entry.key.split('#')[1]);
const textboxChoices = () => chosen.value.filter(isText);
const textOf = (entry) => textboxChoices()[textboxIndex(entry)]?.text ?? '';

const isChosen = (entry) => (entry.textbox
    ? textOf(entry) !== ''
    : chosen.value.some((choice) => refOf(choice) === entry.written));

// Picked or gained through another source (another improvement, a grant...).
const takenElsewhere = (entry) => {
    if (entry.textbox || isChosen(entry)) {
        return false;
    }
    const s = state.value;
    if (verb.value === 'cross') {
        return s.crosses.some((c) => c.path === entry.path && !isThisSet(c.set));
    }
    if (advancing.value) {
        return s.picks.some((p) => p.advance && p.path === entry.path && !isThisSet(p.set));
    }
    return s.gained.some((g) => g.path === entry.path)
        || s.picks.some((p) => p.path === entry.path && !p.advance && !isThisSet(p.set));
};

// Per sub-list limits, e.g. { "@combat_magic.bases": { "min": 1 } }
const limits = computed(() => Object.entries(props.rule.limits ?? {}).map(([ref, limit]) => {
    const path = refPath(ref, hunter.value.playbook, props.self);
    const group = groups.value.find((g) => g.key === path);
    const inGroup = group ? group.entries.filter(isChosen).length : 0;
    return { path, name: group?.name ?? ref, inGroup, ...limit };
}));

const unmetLimits = computed(() => limits.value
    .filter((limit) => limit.min !== undefined && limit.inGroup < limit.min)
    .map((limit) => `at least ${limit.min} from ${limit.name}`));

// An option whose effect would push a rating past its max ("+1 to any rating, max +3")
const atMax = (entry) => !isChosen(entry)
    && (entry.node?.effects ?? []).some((effect) => overMax(effect, state.value));

const isDisabled = (entry) => {
    if (isChosen(entry) || bendRules.value) {
        return false;
    }
    if (!props.set) {
        return true;
    }
    if (takenElsewhere(entry) || atMax(entry) || chosen.value.length >= count.value) {
        return true;
    }
    const groupPath = entry.group ? pathOf(entry.group, hunter.value.playbook) : null;
    return limits.value.some((limit) => limit.path === groupPath && limit.max !== undefined
        && limit.inGroup >= limit.max);
};

const toggle = (entry) => toggleChoice(props.set, entry);

const setText = (entry, text) => setTextChoice(props.set, textboxIndex(entry), text);
</script>

<style scoped>
.choose-rule ul {
    list-style: none;
    padding-left: 0.5em;
    margin: 0.25em 0;
}

.choose-rule li {
    margin: 0.25em 0;
}

.status {
    margin: 0.25em 0;
    font-style: italic;
}

.status.unmet {
    color: var(--color-warning, darkorange);
}

.group-name {
    margin: 0.5em 0 0;
    font-weight: bold;
}

.disabled {
    opacity: 0.5;
}

.crossed > span {
    text-decoration: line-through;
}

.tags,
.note {
    opacity: 0.7;
    font-size: 0.9em;
    margin-left: 0.3em;
}

.textbox {
    width: 12em;
}

.nested {
    margin-left: 1.5em;
    border-left: 2px solid var(--color-button-border);
    padding-left: 0.5em;
}
</style>
