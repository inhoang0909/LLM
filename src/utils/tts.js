export function speak(text, langCode) {
  try {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text || '');
    msg.rate = 0.8;
    switch (langCode) {
      case 'vi': msg.lang = 'vi-VN'; break;
      case 'en': msg.lang = 'en-US'; break;
      case 'cn': msg.lang = 'zh-CN'; break;
      case 'tw': msg.lang = 'zh-TW'; break;
      default: msg.lang = 'en-US';
    }
    window.speechSynthesis.speak(msg);
  } catch (e) {
    console.error('TTS error:', e);
  }
}