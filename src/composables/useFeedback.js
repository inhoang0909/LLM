import { updateLog } from '@/utils/api.js';

/**
 * Feedback composable for translation rating and user feedback.
 * Handles like/dislike actions and submits feedback to backend.
 * @param {Object} state - Reactive state object from parent.
 * @param {Function} showSnackbar - Function to show notification messages.
 */
export function useFeedback(state, showSnackbar) {
  /**
   * Handles user rating (like/dislike) for a translation.
   * If 'dislike', opens feedback dialog for user comments.
   * If 'like', submits feedback immediately.
   * @param {string} action - 'like' or 'dislike'
   */
  function rateTranslated(action) {
    if (!['like','dislike'].includes(action)) return;
    state.improvedTrans.rateSel = action;
    if (action === 'dislike') {
      // Show feedback dialog for additional user input
      state.improvedTrans.dialog = true;
      showSnackbar('Your feedback is very important');
    } else {
      // Submit feedback directly for 'like'
      submitTranslateFeedback(true);
    }
  }

  /**
   * Submits translation feedback to backend.
   * Includes user rating, optional message, and translation details.
   * @param {boolean} skipDialog - If true, closes dialog immediately after submit
   */
  async function submitTranslateFeedback(skipDialog=false) {
    const id = state.improvedTrans.translatedId;
    await updateLog(id, {
      input: state.inputText,
      source_lang: state.detectedLangCode,
      target_lang: state.toLang.langCode,
      user_feedback: {
        msg: state.improvedTrans.msg || null,
        actions: state.improvedTrans.rateSel
      },
      output: state.translation,
      mode: state.selectedModel
    });
    // Close dialog if not skipping
    if (!skipDialog) state.improvedTrans.dialog = false;
    // Clear feedback message after 'dislike'
    if (state.improvedTrans.rateSel === 'dislike') state.improvedTrans.msg = '';
    showSnackbar('Thank you for rating');
  }

  // Expose feedback actions
  return { 
    rateTranslated, 
    submitTranslateFeedback 
  };
}
