<template>
<div class="choose-rule">
    <p class="status" :class="{ unmet: remaining > 0 || unmetLimits.length }">
        {{ verbLabel }} {{ optional ? 'up to ' : '' }}{{ count }}
        <span v-if="remaining > 0"> ({{ remaining }} left)</span>
        <span v-for="limit in unmetLimits" :key="limit"> · {{ limit }}</span>
    </p>
    <div v-for="group in groups" :key="group.key" class="group">
        <p v-if="group.name" class="group-name">{{ group.name }}:</p>
        <ul class="options">
            <li
                v-for="entry in group.entries"
                :key="entry.key"
                :class="{ disabled: isDisabled(entry) }"
            >
                <label :class="{ crossed: verb === 'cross' && isChosen(entry) }">
                    <!-- a write-your-own among other options gets a checkbox too -->
                    <input
                        v-if="!entry.textbox || !onlyTextboxes"
                        type="checkbox"
                        :checked="isChosen(entry)"
                        :disabled="isDisabled(entry)"
                        @change="entry.textbox ? toggleText(entry, $event) : toggle(entry)"
                    />
                    <input
                        v-if="entry.textbox"
                        type="text"
                        class="textbox"
                        placeholder="write your own"
                        :value="textOf(entry)"
                        :disabled="isDisabled(entry)"
                        @change="setText(entry, $event.target.value)"
                    />
                    <span v-if="entry.node">
                        <strong v-if="entry.node.name">{{ entry.node.name }}</strong>
                        <span v-if="entry.node.name && shown(entry.node, 'description')">: </span>
                        <MarkdownText :text="shown(entry.node, 'description')" inline />
                        <span v-if="entry.node.tags?.length" class="tags">
                            ({{ entry.node.tags.join(' ') }})
                        </span>
                    </span>
                    <span v-else-if="entry.literal">{{ entry.text }}</span>
                    <span v-if="takenElsewhere(entry)" class="note">
                        ({{ advancing ? 'already advanced' : 'already have' }})
                    </span>
                    <span v-else-if="atMax(entry)" class="note">(already at max)</span>
                </label>
                <MoveDetails :details="shown(entry.node, 'details')" />
                <!-- an option with its own choice: Practitioner, Arcane Reputation... -->
                <div v-if="isChosen(entry) && verb === 'pick' && entry.node?.choose" class="nested">
                    <ChooseRule
                        v-for="(nested, i) in rulesOf(entry.node)"
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
// One `choose` rule (docs/Schema Notes.md: "Choosing"): its options, the hunter's
// choices for it, and its limits. Fewer than the full count is always allowed;
// going over a limit needs "bend the rules" (provided by the edit page).
import { computed, inject, ref, toRaw } from 'vue';
import { rulesOf } from '@/Hunter';
import { useHunter, useHunterState, usePageText } from '@/HunterContext';
import { optionsOf, pathOf, refPath } from '@/PlaybookData';
import {
    advancesBasicMoves, choiceSet, countOf, isText, overMax, pickRecord, refOf, setTextChoice,
    toggleChoice, verbOf,
} from '@/HunterState';
import MarkdownText from './MarkdownText.vue';
import MoveDetails from './MoveDetails.vue';

const props = defineProps({
    rule: { type: Object, required: true },
    self: Object, // the object the rule is written in, for @this
    set: Object, // the hunter's { from, chosen } for this rule (HunterState.js: choiceSet)
});

const hunter = useHunter();
const state = useHunterState();
const shown = usePageText();
const bendRules = inject('bendRules', ref(false));

const verb = computed(() => verbOf(props.rule));
const count = computed(() => countOf(props.rule));
const VERB_LABELS = { pick: 'Pick', cross: 'Cross off', remove: 'Remove', attach: 'Attach to' };
const verbLabel = computed(() => VERB_LABELS[verb.value]);

// "Mark two basic moves as advanced": picks moves you already have
const advancing = computed(() => advancesBasicMoves(props.self));
const isThisSet = (set) => set === toRaw(props.set);

const containerPath = computed(() => refPath(props.rule.from, hunter.value.playbook, props.self));

// For "remove" and "attach", the options are the hunter's current picks from the container
// (or its sub-list: an extra attaches to one of your bases); so are they for "cross" when the
// container's options are picked (your curse), not had (Tools and Techniques).
const entries = computed(() => {
    const options = optionsOf(props.rule.from, hunter.value.playbook, props.self);
    const path = containerPath.value;
    const picked = new Set(state.value.picks
        .filter((p) => p.path && !isThisSet(p.set)
            && (p.container === path || p.path.startsWith(`${path}.`)))
        .map((p) => p.path));
    if (['remove', 'attach'].includes(verb.value) || (verb.value === 'cross' && picked.size)) {
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
            // "@*." lists group by playbook name (a string)
            const name = typeof group === 'string' ? group : group?.name;
            found = { key, name, node: group, entries: [] };
            list.push(found);
        }
        found.entries.push(entry);
    }
    return list;
});

const chosen = computed(() => props.set?.chosen ?? []);
// `"min": 0`: optional ("If you want, you can take one handy weapon")
const optional = computed(() => props.rule.min === 0);
const remaining = computed(() => Math.max(0,
                                          (props.rule.min ?? count.value) - chosen.value.length));

// The nth @textbox option holds the nth free-text choice.
const textboxIndex = (entry) => Number(entry.key.split('#')[1]);
const textboxChoices = () => chosen.value.filter(isText);
const textOf = (entry) => textboxChoices()[textboxIndex(entry)]?.text ?? '';

const isChosen = (entry) => (entry.textbox
    ? textOf(entry) !== ''
    : chosen.value.some((choice) => refOf(choice) === entry.written));

// Picked or gained through another source (another improvement, a grant...).
const takenElsewhere = (entry) => {
    if (entry.textbox || isChosen(entry) || verb.value === 'attach') {
        return false;
    }
    const s = state.value;
    if (entry.literal) {
        return s.picks.some((p) => p.literal && p.text === entry.text
            && p.container === containerPath.value && !isThisSet(p.set));
    }
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

const onlyTextboxes = computed(() => entries.value.every((entry) => entry.textbox));

// A write-your-own is chosen once it has text: checking its box moves to the text field,
// unchecking clears it.
const toggleText = (entry, event) => {
    if (event.target.checked) {
        event.target.checked = false;
        event.target.closest('label').querySelector('input.textbox').focus();
    } else {
        setText(entry, '');
    }
};

const setText = (entry, text) => setTextChoice(props.set, textboxIndex(entry), text);
</script>

<style scoped>
.choose-rule ul.options {
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
