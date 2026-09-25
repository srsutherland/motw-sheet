<template>
<section class="show-harm">
    <div class="heading">Harm:</div>
    <Track
        class="indent"
        :model-value="hunter.harm"
        @update:model-value="setHarm"
        :max="hunter.harm_max"
        :divider-at="hunter.harm_unstable"
        start="Okay"
        end="Dying"
    />
    <div class="indent">
        <span class="indent">
            Unstable:
            <button
                class="toggle"
                @click="toggleUnstable"
                :title="hunter.unstable ? 'Mark stabilized' : 'Mark unstable'"
            >
                <TrackBox :filled="hunter.unstable" />
            </button>
        </span>
    </div>
</section>
</template>

<script setup>
import { useHunter } from '@/HunterContext';
import TrackBox from './TrackBox.vue';
import Track from './Track.vue';

const hunter = useHunter();

// Reaching the unstable threshold marks the wound unstable. Healing doesn't clear it;
// the player unmarks it once the wound is stabilized.
const setHarm = (value) => {
    const h = hunter.value;
    if (value > h.harm && value >= h.harm_unstable) {
        h.unstable = true;
    }
    h.harm = value;
};

const toggleUnstable = () => {
    const h = hunter.value;
    h.unstable = !h.unstable;
};
</script>

<style scoped>
.indent {
    margin-left: 1em;
}

.heading {
    font-weight: bold;
    /* all caps */
    text-transform: uppercase;
}

.toggle {
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}
</style>
