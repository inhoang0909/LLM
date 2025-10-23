<template>
  <v-container fluid class="pa-4 fill-height">
    <v-row class="fill-height" no-gutters>
      <!-- Sidebar -->
      <v-col
        cols="12"
        md="4"
        class="d-flex flex-column"
        style="overflow-y: auto; max-height: 100vh;"
      >
        <v-skeleton-loader
          v-if="loadingWords"
          type="list-item-two-line"
          class="mb-3"
        />
        <DictSidebar
          :items="searchedWords"
          :categories="filteredCategories"
          :search="search"
          :filter-cat="filterCat"
          :selected="selected"
          @update:search="v => search = v"
          @update:filterCat="v => filterCat = v"
          @select="selectWord"
          @add="openAdd"
        />
      </v-col>

      <!-- Word Detail -->
      <v-col
        cols="12"
        md="8"
        class="d-flex flex-column"
        style="overflow-y: auto; max-height: 100vh;"
      >
        <DictWordDetail 
        :word="selected" 
        @copy="copyText" 
        @edit="openEdit" 
        />
      </v-col>
    </v-row>

    <!-- Dialog Add/Edit -->
    <DictAddDialog
      :model-value="addDialog"
      :form="form"
      :cats-options="filteredCategories"
      :langs="LANGS"
      :saving="saving"
      :delete-loading="deleteLoading"
      :edit-mode="editMode"
      :selected="selected"
      @update:modelValue="v => addDialog = v"
      @reset="resetForm"
      @save="saveWord"
      @update="updateWord"
      @delete="confirmDelete"
      @uploadWords="handleBulkUpload"
    />

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card elevation="2" rounded="lg" class="pa-4" color="grey-lighten-5">
        <v-card-title class="text-h6 font-weight-bold text-red-darken-2">
          <v-icon start class="mr-2" color="red-darken-2">mdi-alert-circle</v-icon>
          {{ $t('dict.deleteWordConfirm') }}
        </v-card-title>

        <v-divider class="my-2" />

        <v-card-text class="text-body-2 text-grey-darken-2">
          {{ $t('dict.deleteWordConfirm') }}
        </v-card-text>

        <v-card-actions class="justify-end mt-4">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="deleteDialog = false">
            {{ $t('dict.cancel') }}
          </v-btn>

          <v-btn color="red-darken-2" variant="elevated" class="text-none" @click="executeDelete">
            <v-icon start>mdi-delete</v-icon>
            {{ $t('dict.deleteWord') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" color="indigo" location="bottom right">
      {{ snackMsg }}
    </v-snackbar>
  </v-container>
</template>


<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDictionaryPage } from '@/composables/useDictionary';
import { useUserCategories } from '@/composables/useUserCategories';
import DictSidebar from '@/components/Dictionary/DictSidebar.vue';
import DictWordDetail from '@/components/Dictionary/DictWordDetail.vue';
import DictAddDialog from '@/components/Dictionary/DictAddDialog.vue';

const { t } = useI18n(); 
const deleteDialog = ref(false);

const {
  LANGS,
  words,
  categories,
  loadingWords,
  filterCat,
  search,
  selected,
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
  notify,
  handleBulkUpload
} = useDictionaryPage();

// Use the user categories composable
const { filteredCategories, filteredWords } = useUserCategories(words, categories);

// Add this computed property:
const searchedWords = computed(() => {
  if (!search.value) return filteredWords.value;
  const s = search.value.toLowerCase();
  return filteredWords.value.filter(w =>
    w.translations?.some(t =>
      t.text?.toLowerCase().includes(s) ||
      t.desc?.toLowerCase().includes(s)
    )
  );
});

function copyText(txt) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(txt || '');
    notify(t('notify.copied'));
  }
}

function confirmDelete() {
  deleteDialog.value = true;
}

function executeDelete() {
  deleteDialog.value = false;
  if (selected.value?.id) {
    deleteWord(selected.value.id).then(() => {
      addDialog.value = false;   
      fetchWords();             
    });
  } else {
    notify('No word selected');
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchWords()]);
});
</script>