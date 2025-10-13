<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-2">
        <v-row no-gutters>
          <!-- Left Column: Camera/Image Controls -->
          <v-col cols="8">
            <v-card flat>
              <div class="d-flex align-center pa-2">
                <v-btn-group>
                  <v-btn :color="imageMode === 'webcam' ? 'primary' : ''" @click="setImageMode('webcam')" density="compact">
                    <v-icon>mdi-webcam</v-icon>
                  </v-btn>
                  <v-btn :color="imageMode === 'upload' ? 'primary' : ''" @click="setImageMode('upload')" density="compact">
                    <v-icon>mdi-file-upload</v-icon>
                  </v-btn>
                  <v-btn :color="imageMode === 'paste' ? 'primary' : ''" @click="setImageMode('paste')" density="compact">
                    <v-icon>mdi-clipboard-image</v-icon>
                  </v-btn>
                </v-btn-group>

                <v-spacer></v-spacer>
                
                <div v-if="imageMode === 'webcam'" class="d-flex align-center">
                  <v-btn color="red" @click="capturePhotoToBase64()" density="compact" class="mr-2">
                    <v-icon>mdi-camera</v-icon>
                  </v-btn>
                  <v-btn v-if="!isLive" color="primary" @click="toggleLiveCamera()" density="compact">
                    <v-icon>mdi-video</v-icon>
                  </v-btn>
                </div>
              </div>

              <div class="position-relative" style="height: calc(100vh - 200px);">
                <!-- Webcam Mode -->
                <div v-if="imageMode === 'webcam'" class="h-100">
                  <video src="" :width="constraint.video.width.ideal" :height="constraint.video.height.ideal" 
                         id="video" :class="{ 'd-none': !isLive }" style="height: 100%; object-fit: contain;">
                  </video>
                  <canvas :width="constraint.video.width.ideal" :height="constraint.video.height.ideal" 
                         id="canvas" :class="{ 'd-none': isLive }" style="height: 100%; object-fit: contain;">
                  </canvas>
                  <v-img v-if="pasted64" :src="pasted64" :class="{ 'd-none': isLive }" 
                         height="100%" contain></v-img>
                </div>

                <!-- Upload Mode -->
                <div v-if="imageMode === 'upload'" class="h-100 d-flex flex-column align-center justify-center">
                  <v-btn color="primary" @click="triggerFileInputDialog" density="compact" class="mb-2">
                    <v-icon>mdi-file-upload</v-icon>
                  </v-btn>
                  <input ref="fileInput" class="d-none" type="file" accept="image/*" @change="handleFileUpload">
                  <v-img v-if="pasted64" :src="pasted64" height="100%" contain></v-img>
                </div>

                <!-- Paste Mode -->
                <div v-if="imageMode === 'paste'" class="h-100 d-flex flex-column align-center justify-center">
                  <v-chip color="info" class="mb-2">Press Ctrl+V to paste</v-chip>
                  <v-img v-if="pasted64" :src="pasted64" height="100%" contain></v-img>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- Right Column: Model Selection and Response -->
          <v-col cols="4">
            <v-card flat height="100%">
              <v-select
                v-model="model"
                :items="modelListing"
                item-title="name"
                item-value="name"
                label="Model"
                return-object
                density="compact"
                hide-details
                class="pa-2"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" density="compact">
                    <v-list-item-title class="text-caption">{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ item.raw.details.family }} | {{ item.raw.details.parameter_size }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <v-divider></v-divider>

              <div class="pa-2">
                <v-text-field
                  v-model.number="modelOptions.temperature"
                  density="compact"
                  hide-details
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  label="Temperature"
                ></v-text-field>

                <v-textarea
                  rows="3"
                  ref="chatInput"
                  label="Prompt"
                  @keydown="keyPressHandler"
                  v-model="newMessage"
                  append-icon="mdi-send"
                  @click:append="visionRequest"
                  density="compact"
                  hide-details
                  class="mt-2"
                ></v-textarea>
              </div>

              <v-divider></v-divider>

              <v-card-text class="response-area" style="height: calc(100vh - 400px); overflow-y: auto;">
                <p>{{ visionResponse }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import typingGif from '@/assets/typing.gif'
var chatWrapper;
export default {
  data() {
    return {
      typingGif,
      pasted64: '',
      // newMessage: `Is the person in the image wearing an ID badge?\nAnswer in JSON format as {"response":"Y"} or {"response":"N"}`,
      newMessage: `Extract all the text.`,
      stream: '',
      messages: [],
      photoDetail: null,
      selectedItem: null,
      isStream: false,
      // model: 'mskimomadto/chat-gph-vision:latest',
      model: 'gemma3:latest',
      modelListing: [],
      apiBaseUrl: 'http://localhost:11434',
      renderMode: 'md', // md or plaintext
      isWaiting: true,
      ragFile: null,
      vectorStore: null,
      modelOptions: { 
        temperature: 0.3,
        // num_ctx: 1024,
        // stop: ['::END','�','[DONE]'],
      },
      photoUrl: null,
      context: [],
      photoBasket: [],
      stream: null,
      video: null,
      canvas: null,
      context: null,
      visionResponse: '',
      constraint: {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      },
      imageMode: 'webcam', // Add this line
      animationFrameId: null,
      isLive: true,
    };
  },
  methods: {
    async getModelListing() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/tags`);
        const data = await response.json();
        this.modelListing = data.models;
        // Set default model if none selected
        if (!this.model && this.modelListing.length > 0) {
          this.model = this.modelListing.find(m => m.name.includes('vision')) || this.modelListing[0];
        }
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    async initWebcamStream(){
      const stream = await navigator.mediaDevices.getUserMedia(this.constraint);
      this.stream = stream;
      this.video.srcObject = stream;
      this.video.style.display = 'block'; // Change to block
      await this.video.play();
    },
    async loadingCameraToCanvas(){
      if (this.isLive && !this.pasted64) {
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        this.animationFrameId = requestAnimationFrame(() => this.loadingCameraToCanvas());
      }
    },  
    capturePhotoToBase64(){
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      this.pasted64 = this.canvas.toDataURL('image/png');
      this.isLive = false;
      this.video.style.display = 'none';
      // Stop the animation frame when photo is captured
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    },
    async sendMessage() {
      if (this.newMessage.trim() !== '') {
        this.messages.push({
          role: 'user',
          content: this.newMessage,
          content_plain : this.newMessage.replace(/\n/g, '<br/>'),
          photo_url: null,
          images: [this.pasted64.replace('data:image/png;base64,','')],
          show: true,
        });
        this.messages.push({
          role: 'assistant',
          content: '',
          show: true,
        });
        // this.newMessage = '';
        await this.chat();
      }
    },
    async visionRequest(){
      let _this = this;
      this.visionResponse = '';
      await fetch(`${this.apiBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model?.name || this.model,
          prompt: this.newMessage,
          options: this.modelOptions,
          images: [this.pasted64.replace('data:image/png;base64,','')],
          stream: false,
          // system: 'Alway reponse in JSON to answer the question !',
          // format: 'json'
        }),
      }).then(res => res.json()).then(data => {
        _this.visionResponse = data.response;
      }).catch(err => {
        console.error(err);
      });
      
    },  
    addToMessages() {
      let _content = document.querySelector('.stream').innerHTML;
      this.messages[this.messages.length - 1].content = _content;
      this.messages[this.messages.length - 1].content_md = this.parseMarkdown(_content);
      this.messages[this.messages.length - 1].content_plain = _content.replace(/\n/g, '<br/>');
    },
    async chat() {
      let _this = this;
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model?.name || this.model,
            messages: this.messages,
            options: this.modelOptions,
            system: 'Alway reponse in JSON to answer the question !',
            // format: 'json'
          }),
        });
        _this.isWaiting = true;
        _this.isStream = true;
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to read response body');
          _this.isStream = false;
        }
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream finished');
            break;
          }
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          lines.map((line) => line.trim()).filter((line) => line !== '');
          document.querySelector('.stream').innerHTML += lines
          .flat()
          .filter((x) => x)
          .map((x) => {
            let _j = JSON.parse(x);
            if(_j.done) {
              _this.addToMessages();
              _this.isStream = false;
              _this.isWaiting = false;
            }
            return _j.message.content;
          })
          .join('');
        }
      } catch (error) {
        console.error(error);
        _this.isStream = false;
        _this.isWaiting = false;
      }
    },
    chatReset() {
      this.isWaiting = false;
      this.isStream = false;
      this.messages = [];
    },
    parseMarkdown(input) {
      const md = new MarkdownIt();
      return md.render(input);
    },
    keyPressHandler(event) {
      if (event.key === 'Enter') {
        if (event.ctrlKey) {
          this.newMessage += '\n';
        } else {
          // this.sendMessage();
          this.capturePhotoToBase64();
          // this.visionRequest();
          setTimeout(() => {
            this.visionRequest();
          }, 500);
          event.preventDefault();
        }
      }
    },
    triggerFileInputDialog() {
      this.$refs.fileInput.click();
    },
    async uploadPhoto(){
      this.$refs.chatInput.focus();
    },
    setImageMode(mode) {
      this.imageMode = mode;
      this.pasted64 = '';
      if (mode === 'webcam') {
        if (!this.stream) {
          this.initWebcamStream();
        } else {
          // Resume animation if webcam mode is selected again
          this.loadingCameraToCanvas();
        }
      } else if (mode !== 'webcam' && this.stream) {
        this.stopWebcam();
      }
    },
    stopWebcam() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.pasted64 = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    toggleLiveCamera() {
      this.isLive = true;
      this.pasted64 = '';
      if (this.stream) {
        this.video.style.display = 'block';
        this.loadingCameraToCanvas();
      } else {
        this.initWebcamStream().then(() => {
          this.loadingCameraToCanvas();
        });
      }
    },
    // endofmethods
  },
  watch: {
    isStream: function (val) {
      if (val) {
        chatWrapper.scrollTop = chatWrapper.scrollHeight;
      }
    },
  },
  mounted() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');
    this.getModelListing(); // Add this line to load models on mount
  },
  beforeDestroy() {
    this.stopWebcam();
  },
  activated() {
    let _this = this;
    chatWrapper = document.getElementById('chatWrapper');
    setInterval(() => {
      if(this.isStream){
        chatWrapper.scrollTop = chatWrapper.scrollHeight;
      }
    }, 200);
    document.onpaste = function (pasteEvent) {
      if (_this.imageMode === 'paste') {
        for (const item of pasteEvent.clipboardData.items) {
          if (item.type.includes('image')) {
            const file = item.getAsFile();
            if (file) {
              _this.context = [];
              _this.chatReset();
              const reader = new FileReader();
              reader.onload = function (event) {
                const base64Data = event.target.result;
                _this.pasted64 = base64Data;
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    }
    // loadig camera to canvas
    this.initWebcamStream().then((stream) => {
      this.stream = stream;
      this.loadingCameraToCanvas();
    });
  }
};
</script>
<style>
canvas#canvas {
  width: 100%;
}
#chatWrapper {
  scrollbar-width: thin;
  scrollbar-color: #1867C0 transparent;
}
#chatWrapper::-webkit-scrollbar {
  width: 10px;
}
#chatWrapper::-webkit-scrollbar-track {
  background: transparent;
}
#chatWrapper::-webkit-scrollbar-thumb {
  background-color: #1867C0;
  border-radius: 20px;
  border: 3px solid transparent;
}
table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 15px #cbcbcb;
  padding-bottom: 50px;
  margin-bottom: 40px;
}
table th,
table td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}
table th {
  background-color: #f4f4f4;
}
table tr:nth-child(even) {
  background-color: #f9f9f9;
}
pre {
  background-color: #282c34;
  color: #abb2bf;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
}
.d-none {
  display: none !important;
}
#video {
  width: 100%;
  display: block;
}
.position-relative {
  position: relative;
}
.h-100 {
  height: 100%;
}
.response-area::-webkit-scrollbar {
  width: 4px;
}
.response-area::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>