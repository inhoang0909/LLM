<template>
  <v-row>
    <v-col cols="12">
      <v-file-input
        v-model="uploadFile"
        :label="$t('dict.selectFile')"
        accept=".json,.csv,.xlsx"
        variant="outlined"
        prepend-icon="mdi-file-upload"
        show-size
        color="primary"
        @change="handleFileSelect"
      />

      <v-alert
        v-if="uploadError"
        type="error"
        variant="tonal"
        class="mt-3"
        closable
        @click:close="uploadError = ''"
      >
        {{ uploadError }}
      </v-alert>

      <v-alert type="info" variant="tonal" class="mt-3">
        {{ $t('dict.fileFormatInfo') }}
      </v-alert>

      <div v-if="uploadPreview.length > 0" class="mt-4">
        <h4 class="mb-2">{{ $t('dict.preview') }}</h4>
        <v-data-table
          :headers="uploadHeaders"
          :items="uploadPreview"
          class="elevation-1"
          :items-per-page="5"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWordFileParser } from '@/composables/useWordFileParser';

const emit = defineEmits(['uploadWords', 'update:uploadPreview']);

const { t } = useI18n();
const uploadFile = ref(null);

const { uploadPreview, uploadError, handleFileSelect } = useWordFileParser();

const uploadHeaders = [
  { title: 'English', key: 'en' },
  { title: 'Vietnamese', key: 'vi' },
  { title: 'Chinese', key: 'zh-tw' },
  { title: 'English Description', key: 'desc.en' },
  { title: 'Vietnamese Description', key: 'desc.vi' },
  { title: 'Chinese Description', key: 'desc.tw' },
  { title: 'Categories', key: 'categories' },
];

defineExpose({
  uploadPreview,
  uploadError,
  reset() {
    uploadFile.value = null;
    uploadPreview.value = [];
    uploadError.value = '';
  },
});
</script>
