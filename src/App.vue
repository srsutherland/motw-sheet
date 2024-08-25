<script setup>
import { ref } from 'vue';
import ActionList from './components/ActionList.vue';
import NewHunter from './components/NewHunter.vue';
import EditHunter from './components/EditHunter.vue';
import ShowHunter from './components/ShowHunter.vue';
//reactive variable
const currentView = ref('action');
const hunter = ref(null);

const changeView = (view, ...args) => {
  console.log(`Changing view to ${view}`);
  console.log(`Args (${args.length}): ${args}`);
  currentView.value = view;
  if (view === 'edit') {
    const hunter_arg = args[0]
    if (hunter_arg) {
      hunter.value = hunter_arg;
      console.log(`Editing ${hunter.value?.name} the ${hunter.value?.playbook}`);
    }
  }
};
</script>

<template>
  <header>
    <h1>MOTW App</h1>
  </header>

  <main>
    <ActionList v-if="currentView === 'action'" @change-view="changeView"/>
    <NewHunter v-if="currentView === 'new'" @change-view="changeView"/>
    <EditHunter v-if="currentView === 'edit'" @change-view="changeView" :hunter="hunter"/>
    <ShowHunter v-if="currentView === 'show'" @change-view="changeView" :hunter="hunter"/>
  </main>
</template>

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
