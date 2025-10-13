<template>
  <v-snackbar
    color="indigo"
    :model-value="snackbar"
    location="bottom right"
    timeout="3000"
    @update:model-value="val => { if(!val) $emit('close'); }"
  >
    {{ msgText }}
  </v-snackbar>
</template>
<script>
export default {
  name: 'SnackBar',
  props: { snackbar: Boolean, msgText: String },
  emits: ['close']
};
</script>