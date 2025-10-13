import { ref } from 'vue';
import { fetchModels } from '@/utils/api.js';

/**
 * MODEL_MAP defines the mapping between quality levels and model names.
 */
const MODEL_MAP = {
  fast: 'qwen3:8b',
  normal: 'gemma3:12b',
  high: 'qwen3:32b'
};

/**
 * useModels composable
 * Handles model selection, loading, and quality changes for translation.
 * @param {Function} showSnackbar - Function to show notification messages.
 */
export function useModels(showSnackbar) {
  // Indicates if models are currently being loaded from backend
  const modelsLoading = ref(false);
  // List of available models for selection
  const availableModels = ref([]);
  // Currently selected model name
  const selectedModel = ref(MODEL_MAP.fast);

  /**
   * Fetches available models from backend API.
   * Filters models to only include allowed ones.
   * Sets selectedModel to first available if current selection is missing.
   */
  async function fetchAvailableModels() {
    modelsLoading.value = true;
    try {
      const data = await fetchModels();
      // Only allow these models for selection
      const allowed = ['qwen3:8b','gemma3:12b','qwen3:32b','qwen2.5vl:latest'];
      // Normalize model list from API
      const models = (data.models || []).map(m => typeof m === 'string' ? { name:m } : m)
        .filter(m => allowed.includes(m.name));
      // If no models returned, fallback to allowed list
      availableModels.value = models.length ? models : allowed.map(n => ({ name:n }));
      // Ensure selectedModel is valid
      if (!availableModels.value.find(m => m.name === selectedModel.value)) {
        selectedModel.value = availableModels.value[0].name;
      }
    } catch (e) {
      // Show error message if fetch fails
      showSnackbar(`Model fetch error: ${e.message}`);
    } finally {
      modelsLoading.value = false;
    }
  }

  /**
   * Handles quality change by updating selectedModel.
   * Falls back to 'fast' model if requested quality is unavailable.
   * @param {string} q - Quality key ('fast', 'normal', 'high')
   */
  function onQualityChange(q) {
    const target = MODEL_MAP[q] || MODEL_MAP.fast;
    if (availableModels.value.some(m => m.name === target)) {
      selectedModel.value = target;
    } else {
      selectedModel.value = MODEL_MAP.fast;
      showSnackbar('Model fallback in use');
    }
  }

  return { 
    MODEL_MAP, 
    modelsLoading, 
    availableModels, 
    selectedModel, 
    fetchAvailableModels, 
    onQualityChange 
  };
}
