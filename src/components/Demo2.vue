<template>
  <v-container fluid class="pa-4" style="height: 100vh; overflow: hidden;">
    <v-row style="height: calc(100vh - 32px); overflow: hidden;">
      <v-col cols="12" md="4" style="height: 100%; overflow: hidden;">
        <v-skeleton-loader
          type="list-item-two-line"
          v-if="loadingWords"
          class="mb-3"
        />
        <DictSidebar
          :items="filteredWords"
          :categories="categories"
          :search="search"
          :filter-cat="filterCat"
          :selected="selected"
          @update:search="v => search = v"
          @update:filterCat="v => filterCat = v"
          @select="selectWord"
          @add="openAdd"
        />
      </v-col>
      <v-col cols="12" md="8" style="height: 100%; overflow: hidden;">
        <DictWordDetail :word="selected" @copy="copyText" @edit="openEdit" />
      </v-col>
    </v-row>

    <DictAddDialog
      :model-value="addDialog"
      :form="form"
      :cats-options="categories"
      :langs="LANGS"
      :saving="saving"
      :delete-loading="deleteLoading"
      :edit-mode="editMode"
      @update:modelValue="v => addDialog = v"
      @reset="resetForm"
      @save="saveWord"
      @update="updateWord"
      @delete="confirmDelete"
    />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card elevation="2" rounded="lg" class="pa-4" color="grey-lighten-5">
        <!-- Title -->
        <v-card-title class="text-h6 font-weight-bold text-red-darken-2">
          <v-icon start class="mr-2" color="red-darken-2">mdi-alert-circle</v-icon>
          {{ $t('dict.deleteWordConfirm') }}
        </v-card-title>

        <v-divider class="my-2" />

        <v-card-text class="text-body-2 text-grey-darken-2">
          {{ $t('dict.deleteWordConfirm') }}
        </v-card-text>

        <v-card-actions class="justify-end mt-4">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            @click="deleteDialog = false"
          >
            {{ $t('dict.cancel') }}
          </v-btn>

          <v-btn
            color="red-darken-2"
            variant="elevated"
            class="text-none"
            @click="executeDelete"
          >
            <v-icon start>mdi-delete</v-icon>
            {{ $t('dict.deleteWord') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="indigo" location="bottom right">
      {{ snackMsg }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'; // Add this import
import { useDictionaryPage } from '@/composables/useDictionary';
import DictSidebar from '@/components/Dictionary/DictSidebar.vue';
import DictWordDetail from '@/components/Dictionary/DictWordDetail.vue';
import DictAddDialog from '@/components/Dictionary/DictAddDialog.vue';

const { t } = useI18n(); // Add this for $t function
const deleteDialog = ref(false);

const {
  LANGS,
  words,
  categories,
  loadingWords,
  loadingCats,
  filterCat,
  search,
  selected,
  filteredWords,
  addDialog,
  form,
  saving,
  deleteLoading,
  editMode,
  snackbar,
  snackMsg,
  // actions
  fetchWords,
  fetchCategories,
  selectWord,
  openAdd,
  openEdit,
  saveWord,
  updateWord,
  deleteWord,
  resetForm,
  notify
} = useDictionaryPage();

function copyText(txt) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(txt || '');
    notify(t('notify.copied')); // Use i18n
  }
}

function autoFillWords() {
  const first = ['en', 'vi', 'zh-tw'].find(k => form.value[k]);
  if (!first) return;
  ['en', 'vi', 'zh-tw'].forEach(k => {
    if (!form.value[k]) form.value[k] = form.value[first];
  });
  notify(t('dict.autoFillComplete')); // Use i18n
}

function fillDescriptions() {
  const first = ['en', 'vi', 'zh-tw'].find(k => form.value.desc[k]);
  if (!first) return;
  ['en', 'vi', 'zh-tw'].forEach(k => {
    if (!form.value.desc[k]) form.value.desc[k] = form.value.desc[first];
  });
  notify(t('dict.descriptionsCopied')); // Use i18n
}

const addFormProxy = computed(() => ({
  en: form.value.en,
  vi: form.value.vi,
  'zh-tw': form.value['zh-tw'],
  desc: form.value.desc,
  cats: form.value.cats
}));

function confirmDelete() {
  deleteDialog.value = true;
}

function executeDelete() {
  deleteDialog.value = false;
  deleteWord();
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchWords()]);
});
</script>