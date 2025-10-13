import { ref, onMounted, onBeforeUnmount } from 'vue';
import { generate } from '@/utils/api.js';

/**
 * useImageExtract composable
 * Handles image upload, clipboard paste, and OCR extraction to text.
 * @param {Object} state - Reactive state object from parent.
 * @param {Function} showSnackbar - Function to show notification messages.
 * @param {Boolean} clipboardPasteEnabled - Enable paste-to-extract feature.
 */
export function useImageExtract(state, showSnackbar, clipboardPasteEnabled = true) {
  // Stores uploaded image as data URL for preview
  const uploadedImage = ref(null);
  // Stores base64 string for OCR API
  const uploadedImageBase64 = ref(null);
  // Indicates if OCR extraction is in progress
  const isExtractingText = ref(false);

  /**
   * Opens file dialog for user to select an image.
   */
  function triggerImageUpload() {
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = 'image/*';
    el.onchange = handleImageUpload;
    el.click();
  }

  /**
   * Handles image file selection, reads as base64, and triggers OCR extraction.
   * @param {Event} e - File input change event
   */
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      uploadedImage.value = ev.target.result;
      uploadedImageBase64.value = ev.target.result.split(',')[1];
      await extractTextFromImage();
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be uploaded again
    e.target.value = '';
  }

  /**
   * Sends image to OCR API and updates inputText in parent state.
   */
  async function extractTextFromImage() {
    if (!uploadedImageBase64.value) {
      showSnackbar('Please upload an image first');
      return;
    }

    isExtractingText.value = true;
    // Abort OCR if it takes longer than 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    try {
      const json = await generate({
        model: 'qwen2.5vl:latest',
        prompt: 'Extract all visible text from this image. Return only the text, nothing else.',
        images: [uploadedImageBase64.value],
        stream: false,
        options: { temperature: 0 },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (json.response) {
        // Clean up common AI response prefixes
        const cleaned = json.response
          .replace(/^(Here('s| is) the text( from the image)?:?\s*)/i, '')
          .replace(/^I see the following text:?\s*/i, '')
          .replace(/^The text in the image (reads|says):?\s*/i, '')
          .trim();
        // Update parent inputText with extracted text
        state.inputText = cleaned;
      }
    } catch (error) {
      console.error('Error in OCR:', error);
      if (error.name === 'AbortError') {
        showSnackbar('OCR processing took too long. If the image is large, try reducing its size.');
      } else {
        showSnackbar('Error extracting text from image. Please try again.');
      }
      clearImage();
    } finally {
      isExtractingText.value = false;
    }
  }

  /**
   * Clears uploaded image and base64 data.
   */
  function clearImage() {
    uploadedImage.value = null;
    uploadedImageBase64.value = null;
  }

  /**
   * Handles paste event for images from clipboard (e.g. screenshot paste).
   * Automatically extracts text if image is detected.
   * @param {ClipboardEvent} event - Paste event
   */
  async function handleClipboardPaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        event.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = async ev => {
          uploadedImage.value = ev.target.result;
          uploadedImageBase64.value = ev.target.result.split(',')[1];
          await extractTextFromImage();
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  }

  // Register clipboard paste handler on mount if enabled
  onMounted(() => {
    if (clipboardPasteEnabled) {
      document.addEventListener('paste', handleClipboardPaste);
    }
  });

  // Remove clipboard paste handler on unmount
  onBeforeUnmount(() => {
    document.removeEventListener('paste', handleClipboardPaste);
  });
  return {
    uploadedImage,
    uploadedImageBase64,
    isExtractingText,
    triggerImageUpload,
    handleImageUpload,
    extractTextFromImage,
    clearImage
  };
}
