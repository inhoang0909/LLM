<template>
  <v-dialog
    :model-value="dialog"
    max-width="950"
    @update:model-value="v => { if(!v) $emit('close'); }"
  >
    <v-card>
      <v-card-text>
        <div class="d-flex justify-end">
          <v-btn variant="text" color="red" @click="$emit('close')">
            {{ $t('ui.cancel') }}
          </v-btn>
        </div>
        <v-alert type="info" class="mb-2">
          {{ $t('trans.dictAiWarning') }}
        </v-alert>
        <div v-if="response && response.origin_word">
          <h3 class="text-center text-uppercase mb-2">{{ response.origin_word }}</h3>
        </div>
        <div v-else class="text-grey">{{ $t('ui.noData') }}</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  name: 'DictionaryDialog',
  props: { dialog: Boolean, response: Object },
  emits: ['close']
};
</script>