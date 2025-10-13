<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="my-0">
        <v-alert color="red" class="ma-0">
          {{ $t('trans.warning') }}
        </v-alert>
      </v-col>

      <v-col cols="12" md="6">
        <TranslateInput
          :selected-quality="selectedQuality"
          :models-loading="modelsLoading"
          :input-text="inputText"
          :is-vision-model="!!uploadedImage"
          :uploaded-image="uploadedImage"
          :is-extracting-text="isExtractingText"
          :is-translating="isTranslating"
          :current-model="selectedModel"
          :categories="categories"
          :selected-categories="selectedCategories"
          @update:quality="onQualityChange"
          @update:text="v => (inputText = v)"
          @update:categories="updateCategories"
          @fetch-models="fetchAvailableModels"
          @translate="translateWrapper"
          @trigger-image="triggerImageUpload"
          @clear-image="clearImage"
        />
      </v-col>

      <v-col cols="12" md="6">
        <TranslateOutput
          :translation-raw="currentTranslation"
          :rate-sel="state.improvedTrans.rateSel"
          :is-trans-error="isTransError"
          :languages="languages"
          :current-lang-code="toLang.langCode"
          :piyin-output="pinyinFmt"
          :enhanced-trans="enhancedTrans"
          @rate="rateTranslated"
          @copy="() => copyContent(currentTranslation)"
          @speak="speakWrapper"
          @change-lang="changeTargetLang"
          @apply-enhanced="applyEnhancedTrans"
        />
      </v-col>
    </v-row>

    <FeedbackDialog
      :dialog="state.improvedTrans.dialog"
      :msg="state.improvedTrans.msg"
      @update:msg="v => (state.improvedTrans.msg = v)"
      @close="state.improvedTrans.dialog = false"
      @submit="submitTranslateFeedback"
    />

    <DictionaryDialog
      :dialog="state.dictLookup.dialog"
      :response="state.dictLookup.response"
      @close="state.dictLookup.dialog = false"
    />

    <SnackBar
      :snackbar="snackbar"
      :msg-text="msgText"
      @close="snackbar = false"
    />
  </v-container>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch, toRefs } from 'vue';

import TranslateInput from './Translate/TranslateInput.vue';
import TranslateOutput from './Translate/TranslateOutput.vue';
import FeedbackDialog from './Translate/FeedbackDialog.vue';
import DictionaryDialog from './Translate/DictionaryDialog.vue';
import SnackBar from './Translate/SnackBar.vue';

import pinyin from 'pinyin';
import specialChars from '@/assets/specialChar.js';
import { useTranslationHelpers } from '@/composables/useTranslationHelpers';
import { useModels } from '@/composables/useModels';
import { useTranslate } from '@/composables/useTranslation';
import { useFeedback } from '@/composables/useFeedback';
import { useImageExtract } from '@/composables/useImageExtract';
import { useSnackbar } from '@/composables/useSnackbar';
import { useDictionaryPage } from '@/composables/useDictionary'; // Add this import

const state = reactive({
  selectedQuality: 'fast',
  selectedModel: '',
  availableModels: [],

  inputText: '',
  translation: '',
  translationsMap: {},

  enhancedTrans: '',
  enhanceSource: { output: null, isLoading: false, debug: null },

  toLang: {
    text: { en: 'English', vi: 'Tiếng Anh', zh: '英语' },
    langCode: 'en',
    value: 'English',
    model: ''
  },
  languages: [
    { text:{ en:'Vietnamese', vi:'Tiếng Việt', zh:'越南语'}, langCode:'vi', value:'Vietnamese', model:'' },
    { text:{ en:'English', vi:'Tiếng Anh', zh:'英语'}, langCode:'en', value:'English', model:'' },
    { text:{ en:'Chinese (Traditional)', vi:'Tiếng Trung (Phồn thể)', zh:'繁体中文'}, langCode:'tw', value:'Chinese (Traditional)', model:'' }
  ],

  dictLookup: { dialog:false, isLoading:false, response:{} },

  improvedTrans: { rateSel:null, translatedId:'', dialog:false, msg:'' },

  detectedLangCode: null,
  specialChars
});

const { snackbar, msgText, showSnackbar } = useSnackbar();

// Add dictionary functionality
const { categories, fetchCategories } = useDictionaryPage();
const selectedCategories = ref([]);

const {
  MODEL_MAP,
  modelsLoading,
  availableModels,
  selectedModel,
  fetchAvailableModels,
  onQualityChange
} = useModels(showSnackbar);

watch(selectedModel, v => (state.selectedModel = v));
watch(availableModels, v => (state.availableModels = v));

const {
  translation,
  translationsMap,
  detectedLangCode,
  isTranslating,
  isTransError,
  translate
} = useTranslate(state, showSnackbar, categories, selectedCategories);

watch(translation, v => (state.translation = v));
watch(detectedLangCode, v => (state.detectedLangCode = v));
watch(translationsMap, v => (state.translationsMap = v));

const { rateTranslated, submitTranslateFeedback } = useFeedback(state, showSnackbar);

const {
  uploadedImage,
  isExtractingText,
  triggerImageUpload,
  clearImage
} = useImageExtract(state, showSnackbar);

const currentTranslation = computed(() => state.enhancedTrans || state.translation);
const hasTranslatedOnce = ref(false);
const isManualTranslating = ref(false);
const skipNextAutoTranslate = ref(false);

const pinyinFmt = computed(() => {
  if (!currentTranslation.value || !['cn','tw'].includes(state.toLang.langCode)) return '';
  const cleaned = currentTranslation.value.replace(/<b>|<\/b>/g,'');
  return pinyin(cleaned, { segment:true, group:true }).join(' ');
});

const {
  applyEnhancedTrans,
  copyContent,
  speakWrapper,
  changeTargetLang
} = useTranslationHelpers(state, currentTranslation, showSnackbar);

const {
  selectedQuality,
  inputText,
  toLang,
  languages,
  enhancedTrans
} = toRefs(state);

// Add function to update selected categories
function updateCategories(cats) {
  selectedCategories.value = cats;
}

onMounted(async () => {
  // Fetch both models and categories
  await Promise.all([
    fetchAvailableModels(),
    fetchCategories()
  ]);
});

async function translateWrapper() {
  skipNextAutoTranslate.value = true;
  isManualTranslating.value = true;
  await translate();
  hasTranslatedOnce.value = true;
  isManualTranslating.value = false;
}

watch(
  [
    selectedModel,
    availableModels,
    translation,
    detectedLangCode,
    translationsMap
  ],
  ([model, models, trans, lang, map]) => {
    state.selectedModel = model;
    state.availableModels = models;
    state.translation = trans;
    state.detectedLangCode = lang;
    state.translationsMap = map;
  }
);
</script>

<style>
#output b { text-decoration: underline; color: orange; }
.simpleTable { border-collapse: collapse; width: 100%; }
.simpleTable th, .simpleTable td { border:1px solid #ddd; padding:8px; text-align:left; }
.simpleTable th { background:#f2f2f2; }
.simpleTable tr:nth-child(even){ background:#f9f9f9; }
.simpleTable tr:hover { background:#f1f1f1; }
</style>
