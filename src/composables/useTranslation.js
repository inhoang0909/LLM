import { ref, watch, toRaw } from 'vue';
import { multiTranslate, ragTranslate, saveLog } from '@/utils/api.js';

export function useTranslate(state, showSnackbar, categories = ref([]), selectedCategories = ref([])) {
  const translation = ref('');
  const translationsMap = ref({});
  const detectedLangCode = ref(null);
  const isTranslating = ref(false);
  const isTransError = ref(false);
  const hasTranslatedOnce = ref(false);
  const SOURCE_TAG = 'hrm';

  // Helper: Convert selected category IDs to names
  function getCategoryNames(ids) {
    const rawIds = toRaw(ids);
    return rawIds
      .map(id => {
        const cat = categories.value.find(c => c.id === id);
        return cat ? cat.name : null;
      })
      .filter(Boolean);
  }

  // CLEAR OUTPUT WHEN INPUT TEXT CHANGES (new context uploaded / pasted)
  watch(
    () => state.inputText,
    (newVal, oldVal) => {
      if (oldVal == null) return;            // first assignment
      if (!newVal || newVal !== oldVal) {
        translation.value = '';
        translationsMap.value = {};
        state.enhancedTrans = '';
        state.improvedTrans.rateSel = null;
        state.improvedTrans.translatedId = '';
        isTransError.value = false;
        hasTranslatedOnce.value = false;
      }
    }
  );

  /**
   * Performs translation using backend API.
   * Updates translation state and logs translation for feedback.
   */
  async function translate() {
    if (!state.inputText || !state.inputText.trim()) {
      showSnackbar('Empty input');
      return;
    }

    isTranslating.value = true;
    isTransError.value = false;
    translation.value = 'Translating...';

    try {
      const raw = state.toLang.langCode;
      const targetCode = raw === 'tw' ? 'zh-tw' : raw === 'cn' ? 'zh-cn' : raw;

      // Get category names from IDs
      const categoryNames = getCategoryNames(selectedCategories.value);
      const hasCategories = categoryNames.length > 0;

      // Build base payload
      const basePayload = {
        text: state.inputText,
        targetLangs: [targetCode],
        model: state.selectedModel.replace(':', '-'),
        source: hasCategories ? SOURCE_TAG : 'web'
      };

      let res;
      
      // Choose API endpoint based on whether categories are selected
      if (hasCategories) {
        // Call RAG translate API with categories
        const ragPayload = {
          ...basePayload,
          categories: categoryNames
        };
        console.log('Calling RAG translate with payload:', ragPayload);
        res = await ragTranslate(ragPayload);
      } else {
        // Call normal translate API without categories
        console.log('Calling normal translate with payload:', basePayload);
        res = await multiTranslate(basePayload);
      }

      // Unwrap possible { data: {...} } structure
      const data = res?.data ?? res;

      if (!data?.translation || typeof data.translation !== 'object') {
        throw new Error('Invalid translation payload');
      }

      // Normalize keys
      const normalized = { ...data.translation };
      if (normalized['zh-tw'] && !normalized['tw']) normalized['tw'] = normalized['zh-tw'];
      if (normalized['zh-cn'] && !normalized['cn']) normalized['cn'] = normalized['zh-cn'];

      // Merge into existing map so previously translated langs stay available
      translationsMap.value = { ...translationsMap.value, ...normalized };

      // Update primary displayed translation for current UI target lang
      translation.value =
        translationsMap.value[state.toLang.langCode] ||
        translationsMap.value[raw] ||
        '';

      detectedLangCode.value = data.source_language || data.sourceLanguage || null;

      // Save log (ignore if no translation text)
      if (translation.value) {
        const logPayload = {
          input: state.inputText,
          source_lang: detectedLangCode.value,
          target_lang: state.toLang.langCode,
          user_feedback: { msg: '', actions: '' },
          output: translation.value,
          mode: basePayload.model,
          source: basePayload.source
        };
        
        // Add categories to log if they exist
        if (hasCategories) {
          logPayload.categories = categoryNames;
        }
        
        const logResp = await saveLog(logPayload);
        if (logResp?.id) state.improvedTrans.translatedId = logResp.id;
      }

      // Mark that user has performed a manual translation
      hasTranslatedOnce.value = true;
    } catch (e) {
      translation.value = '';
      isTransError.value = true;
      showSnackbar(`Translation failed: ${e.message}`);
      console.error('Translation error:', e);
    } finally {
      isTranslating.value = false;
    }
  }

  /**
   * Watches for changes in input text or target language.
   * If user has already translated once, automatically translates when target language changes.
   */
  watch(
    () => [state.inputText, state.toLang.langCode],
    ([text, newLang], [oldText, oldLang]) => {
      if (!text) return;
      if (!hasTranslatedOnce.value) return;
      // Only auto-translate if text is unchanged and target language changes
      if (text === oldText && newLang !== oldLang) {
        // If we already have that language in the map, just swap without API call
        if (translationsMap.value[newLang]) {
          translation.value = translationsMap.value[newLang];
        } else {
          translate();
        }
      }
    }
  );

  // Expose translation state and actions to parent
  return {
    translation,
    translationsMap,
    detectedLangCode,
    isTranslating,
    isTransError,
    selectedCategories,
    translate
  };
}
