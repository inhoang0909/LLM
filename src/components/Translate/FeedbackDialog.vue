<template>
  <v-dialog
    :model-value="dialog"
    max-width="480"
    @update:model-value="v => { if(!v) $emit('close'); }"
  >
    <v-card>
      <v-card-title>
        <v-icon size="small">mdi-thumb-up</v-icon>
        {{ $t('trans.transFeedbackTitle') }}
      </v-card-title>
      <v-card-text>
        <v-textarea
          v-model="localMsg"
          auto-grow
          variant="outlined"
          :placeholder="$t('notify.yourFeedbackIsVeryImportant')"
          @update:model-value="$emit('update:msg', localMsg)"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="red" @click="$emit('close')">{{ $t('ui.cancel') }}</v-btn>
        <v-spacer />
        <v-btn color="green" variant="elevated" @click="$emit('submit')">
          {{ $t('ui.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  name: 'FeedbackDialog',
  props: { dialog: Boolean, msg: String },
  emits: ['close','submit','update:msg'],
  data(){ return { localMsg: this.msg }; },
  watch:{ msg(v){ this.localMsg = v; } }
};
</script>