<template>
  <header>
    <h1><a href="?" @click.prevent="changeView('action')">Monster of the Sheets</a></h1>
  </header>

  <main>
    <ActionList v-if="currentView === 'action'" @change-view="changeView"/>
    <NewHunter v-if="currentView === 'new'" @change-view="changeView"/>
    <EditHunter v-if="currentView === 'edit'" @change-view="changeView" :hunter="hunter"/>
    <ShowHunter v-if="currentView === 'show'" @change-view="changeView" :hunter="hunter"/>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import ActionList from './components/ActionList.vue';
import NewHunter from './components/NewHunter.vue';
import EditHunter from './components/EditHunter.vue';
import ShowHunter from './components/ShowHunter.vue';
import { loadHunter, saveHunter } from './Storage';

const currentView = ref('action');
const hunter = ref(null);

// Routes live in the query string (GitHub Pages can't serve arbitrary paths):
//   ?          -> action (home)
//   ?new       -> new
//   ?view={id} -> show
//   ?edit={id} -> edit
const urlFor = (view, id) => {
  switch (view) {
    case 'new': return '?new';
    case 'show': return `?view=${id}`;
    case 'edit': return `?edit=${id}`;
    default: return '?';
  }
};

// Set the view from the current URL. Unknown hunter ids fall back to home.
const loadRoute = () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('view') || params.get('edit');
  if (params.has('new')) {
    currentView.value = 'new';
  } else if (id) {
    hunter.value = loadHunter(id);
    if (hunter.value) {
      currentView.value = params.has('edit') ? 'edit' : 'show';
      return;
    }
    console.error(`No saved hunter with id ${id}`);
    history.replaceState(null, '', urlFor('action'));
    currentView.value = 'action';
  } else {
    currentView.value = 'action';
  }
};

const changeView = (view, hunter_arg) => {
  if (hunter_arg) {
    hunter.value = hunter_arg;
    saveHunter(hunter_arg);
  }
  currentView.value = view;
  history.pushState(null, '', urlFor(view, hunter.value?.uid));
};

// Autosave: any change to the current hunter is written to localStorage
watch(hunter, (h) => h && saveHunter(h), { deep: true });

window.addEventListener('popstate', loadRoute);
loadRoute();
</script>

<style scoped>
header {
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border);
}

header h1 {
  text-align: center;
  margin: 0;
  padding: 5px;
  font-size: 2rem;
  font-weight: 400;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
