import { onMounted, onUnmounted } from 'vue';

export function useDifyChatbot(config = {}) {
  // Default configuration
  const defaultConfig = {
    token: '5tiLgtnpPX2nRwf7',
    baseUrl: 'http://10.13.34.181',
    inputs: {},
    systemVariables: {},
    userVariables: {}
  };

  // Merge with custom config
  const chatbotConfig = { ...defaultConfig, ...config };

  // Script element reference
  let scriptElement = null;
  let styleElement = null;

  // Initialize chatbot
  function initChatbot() {
    // Set global config
    window.difyChatbotConfig = chatbotConfig;

    // Inject script if not already present
    if (!document.getElementById(chatbotConfig.token)) {
      scriptElement = document.createElement('script');
      scriptElement.src = `${chatbotConfig.baseUrl}/embed.min.js`;
      scriptElement.id = chatbotConfig.token;
      scriptElement.defer = true;
      document.body.appendChild(scriptElement);
    }

    // Inject styles
    styleElement = document.createElement('style');
    styleElement.innerHTML = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Inject style into iframe after it loads
    setTimeout(() => {
      const iframe = document.querySelector('#dify-chatbot-bubble-window iframe');
      if (iframe && iframe.contentDocument) {
        const iframeStyle = iframe.contentDocument.createElement('style');
        iframeStyle.innerHTML = `
          .flex.shrink-0.items-center.gap-1.5.px-2 { 
            display: none !important; 
          }
        `;
        iframe.contentDocument.head.appendChild(iframeStyle);
      }
    }, 1500);
  }

  // Cleanup chatbot
  function cleanupChatbot() {
    // Remove script
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
    }

    // Remove style
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    // Remove chatbot elements from DOM
    const bubble = document.getElementById('dify-chatbot-bubble-button');
    const window = document.getElementById('dify-chatbot-bubble-window');
    if (bubble) bubble.remove();
    if (window) window.remove();

    // Clean up global config
    delete window.difyChatbotConfig;
  }

  // Lifecycle hooks
  onMounted(() => {
    initChatbot();
  });

  onUnmounted(() => {
    cleanupChatbot();
  });

  return {
    initChatbot,
    cleanupChatbot
  };
}