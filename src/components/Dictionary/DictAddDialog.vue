<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1080"
    persistent
  >
    <v-card elevation="2" rounded="lg" class="pa-4" color="grey-lighten-5">
      <v-card-title class="d-flex justify-space-between align-center">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="manual">
            {{ editMode ? $t('dict.updateWord') : $t('dict.addManually') }}
          </v-tab>
          <v-tab v-if="!editMode" value="upload">
            {{ $t('dict.uploadFile') }}
          </v-tab>
        </v-tabs>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="grey-darken-1"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider class="my-2" />

      <v-card-text>
        <v-window v-model="activeTab">
          <v-window-item value="manual">
            <ManualForm
              :form="form"
              :langs="langs"
              :cats-options="catsOptions"
            />
          </v-window-item>

          <v-window-item v-if="!editMode" value="upload">
            <UploadFile ref="uploadRef" />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end mt-2">
        <v-btn
          variant="text"
          color="grey-darken-1"
          @click="() => { $emit('reset'); uploadRef?.reset(); activeTab = 'manual'; }"
        >
          {{ $t('dict.reset') }}
        </v-btn>

        <v-btn
          v-if="!editMode && activeTab === 'upload' && uploadRef?.uploadPreview?.length > 0"
          color="green-darken-2"
          variant="elevated"
          :disabled="saving"
          :loading="saving"
          @click="$emit('uploadWords', uploadRef.uploadPreview)"
        >
          {{ $t('dict.uploadWords', { count: uploadRef.uploadPreview.length }) }}
        </v-btn>

        <v-btn
          v-else-if="activeTab === 'manual'"
          :color="editMode ? 'orange-darken-2' : 'green-darken-2'"
          variant="elevated"
          :disabled="saving"
          :loading="saving"
          @click="editMode ? $emit('update', selected?.id) : $emit('save')"
        >
          {{ editMode ? $t('dict.updateWord') : $t('dict.saveNewWord') }}
        </v-btn>

        <v-btn
          v-if="editMode && !deleteLoading"
          color="red-darken-2"
          variant="elevated"
          @click="$emit('delete', selected?.id)"
        >
          {{ $t('dict.deleteWord') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ManualForm from '@/components/Dictionary/Dialog/ManualForm.vue';
import UploadFile from '@/components/Dictionary/Dialog/UploadFile.vue';

const props = defineProps({
  modelValue: Boolean,
  form: Object,
  catsOptions: Array,
  saving: Boolean,
  deleteLoading: Boolean,
  editMode: Boolean,
  langs: Array,
  selected: Object
});

const emit = defineEmits([
  'update:modelValue',
  'save',
  'update',
  'delete',
  'reset',
  'uploadWords',
]);

const { t } = useI18n();
const activeTab = ref('manual');
const uploadRef = ref(null);
</script>
