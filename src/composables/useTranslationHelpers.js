import { speak } from '@/utils/tts.js';


export function useTranslationHelpers(state, currentTranslation, showSnackbar) {
  // Áp dụng bản dịch nâng cao
  function applyEnhancedTrans() {
    if (!state.enhancedTrans) return;
    state.translation = state.enhancedTrans;
    state.enhancedTrans = '';
  }

  // Copy text vào clipboard
  function copyContent(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text || '')
        .then(() => showSnackbar('Copied'))
        .catch(() => showSnackbar('Copy failed'));
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text || '';
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showSnackbar('Copied');
      } catch {
        showSnackbar('Copy failed');
      }
      document.body.removeChild(textarea);
    }
  }

  // Phát âm bản dịch hiện tại
  function speakWrapper() {
    speak(currentTranslation.value, state.toLang.langCode);
  }

  // change target language
  function changeTargetLang(code) {
    const f = state.languages.find(l => l.langCode === code);
    if (f) state.toLang = f;
  }

  return {
    applyEnhancedTrans,
    copyContent,
    speakWrapper,
    changeTargetLang
  };
}