import { ref } from 'vue';

export function useSnackbar() {
  const snackbar = ref(false);
  const msgText = ref('');

  function showSnackbar(msg) {
    msgText.value = msg;
    snackbar.value = true;
  }

  return { snackbar, msgText, showSnackbar };
}
