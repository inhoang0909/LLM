<template>
  <div>
    <h1>{{ greeting }}</h1>
    <button @click="changeGreeting">Change Greeting</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      greeting: 'Hello, Vite Vue 3!',
    };
  },
  methods: {
    changeGreeting() {
      this.greeting = 'New Greeting!';
    },
  },
};
</script>

<style>
/* Add your styles here if needed */
</style>
