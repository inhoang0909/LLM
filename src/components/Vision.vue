<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Left column: image controls and preview -->
          <v-col cols="12" md="5">
            <v-card class="pa-2 vision-card full-height-card">
              <!-- scrollable body -->
              <div class="vision-body">
                <v-card-text class="vision-scroll">
                  <div class="mb-3">
                    <v-btn-toggle v-model="selectedVisionModel" mandatory>
                      <v-btn value="qwen2.5vl:latest">Fast</v-btn>
                      <v-btn value="qwen2.5vl:32b">High Quality</v-btn>
                    </v-btn-toggle>
                  </div>

                  <div class="mb-3">
                    <v-btn-toggle v-model="task" mandatory>
                      <v-btn value="ocr">OCR</v-btn>
                      <v-btn value="table">Extract Table</v-btn>
                      <v-btn value="search">Search Object</v-btn>
                      <v-btn value="question">Question</v-btn>
                    </v-btn-toggle>
                  </div>

                  <div v-if="task === 'search'" class="mb-3">
                    <v-text-field v-model="searchObject" label="Object name (for search)" dense></v-text-field>
                  </div>
                  <div v-if="task === 'question'" class="mb-3">
                    <v-textarea
                      v-model="questionPrompt"
                      label="Question prompt"
                      rows="2"
                      dense
                      @keydown="onQuestionKeydown"
                      @keydown.native="onQuestionKeydown"
                    ></v-textarea>
                  </div>

                  <div class="d-flex gap-2 mb-2">
                    <v-btn @click="triggerFileInputDialog" variant="outlined" prepend-icon="mdi-upload">Upload</v-btn>
                    <v-btn @click="pasteHint" variant="outlined">Paste</v-btn>
                  </div>

                  <div class="dropZone mb-3" @dragover.prevent @drop.prevent="handleDrop">
                    <div class="dropInner">
                      <p v-if="!pasted64">Drop image here or upload / paste from clipboard</p>
                        <div v-if="pasted64" style="position:relative; display:inline-block; width:100%;">
                          <v-img :src="pasted64" contain :max-height="previewHeight" style="width:100%; display:block;"></v-img>
                          <v-btn small icon color="blue" class="eye-btn" @click="showLightbox = true" style="position:absolute; top:6px; right:6px; z-index:1050; background: rgba(33,150,243,0.95);">
                            <v-icon style="color:white">mdi-eye</v-icon>
                          </v-btn>
                        </div>
                      <!-- processing shimmer overlay (shows while isProcessing) covers full preview area -->
                      <div v-if="isProcessing && pasted64" class="overlay shimmer"></div>
                    </div>
                  </div>

                  <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onFileChange" />

                  <div class="mt-4">
                    <small class="grey--text">API candidates: http://10.13.33.50:11434 (fast primary), http://10.13.34.181:11434 (fallback / high-quality)</small>
                  </div>
                </v-card-text>
              </div>

              <!-- fixed footer with run button to avoid overflow -->
              <v-card-actions class="vision-footer">
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="visionRequest" :loading="isProcessing">Run</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Right column: responses -->
          <v-col cols="12" md="7">
            <v-card class="pa-2 full-height-card">
              <v-card-text>
                <!-- Stream expansion panel visible for all tasks -->
                <v-expansion-panels v-model="streamPanelActive" multiple>
                  <v-expansion-panel>
                    <v-expansion-panel-title>Stream Output</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <!-- show only the assembled "response" content (chat-like) -->
                      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <div class="stream-output" style="white-space:pre-wrap; max-height:200px; overflow:auto; flex:1;">{{ streamContentAssembled || streamContent }}</div>
                        <div style="display:flex; flex-direction:column; gap:6px; margin-left:8px;">
                          <v-btn small color="error" @click="abortStream" :disabled="!isProcessing">Stop</v-btn>
                          <div v-if="streamAborted" style="font-size:0.8em; color:#ff6b6b;">Aborted</div>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <div class="result-area" ref="resultContainer">
                  <template v-if="task !== 'question' && task !== 'table'">
                    <canvas ref="resultCanvas" class="result-canvas" :width="canvasWidth" :height="canvasHeight" v-if="task !== 'ocr'"></canvas>
                  </template>

                  <!-- OCR editable textarea -->
                  <div v-if="task === 'ocr'" class="ocr-container" style="width:100%; margin-top:8px;">
                    <v-textarea
                      v-model="ocrText"
                      label="OCR Result (editable)"
                      auto-grow
                      rows="4"
                      style="width:100%"
                    ></v-textarea>
                  </div>
                  <!-- Table view -->
                  <div v-if="task === 'table'" style="width:100%; margin-top:8px;">
                    <div class="table-scroll" v-if="tableData && tableData.headers && tableData.headers.length">
                      <v-simple-table class="result-table">
                      <thead>
                        <tr>
                          <th v-for="(h, hi) in tableData.headers" :key="hi">{{ h }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(r, ri) in tableData.rows" :key="ri">
                          <td v-for="(c, ci) in r" :key="ci">{{ c }}</td>
                        </tr>
                      </tbody>
                      </v-simple-table>
                    </div>
                    <div v-else style="margin-top:8px;">
                      <v-alert type="info">No table data found.</v-alert>
                    </div>
                  </div>

                  <!-- Chat UI for question task -->
                  <div v-if="task === 'question'" class="chat-box" style="width:100%; margin-top:8px;">
                    <div class="chat-messages" ref="chatMessages" style="max-height:360px; overflow:auto; display:flex; flex-direction:column-reverse;">
                      <template v-for="(m, i) in reversedMessages" :key="i">
                        <div :class="['chat-message', m.title === 'Question' ? 'chat-user' : 'chat-bot']" style="padding:8px; margin:6px 0; border-radius:8px;">
                          <div class="chat-title" style="font-weight:600; font-size:0.9em; margin-bottom:4px;">{{ m.title }}</div>
                          <div class="chat-content" v-html="m.content"></div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </v-card-text>
              <!-- footer area for copy buttons and spacing -->
                <v-card-actions class="response-footer">
                <v-spacer></v-spacer>
                <!-- copy buttons moved here: OCR and Table copy actions -->
                <v-btn small color="primary" v-if="task === 'ocr'" :disabled="!ocrText" @click="copyOcrText">Copy OCR</v-btn>
                <v-btn small color="primary" v-if="task === 'table'" :disabled="!tableData || !tableData.headers.length" @click="copyTableAsTSV">Copy Table</v-btn>
                <v-btn small color="error" v-if="task === 'question'" @click="clearChat">Clear Chat</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
                  <!-- lightbox dialog placed inside main template -->
                  <v-dialog v-model="showLightbox" max-width="900px">
                    <v-card>
                      <v-img :src="pasted64" contain style="max-height:80vh;"></v-img>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="showLightbox = false">Close</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
    </v-main>
  </v-app>
</template>

<script>
import typingGif from '@/assets/typing.gif'

export default {
  data() {
    return {
      pasted64: null,
      typingGif,
      isProcessing: false,
  // controller used to abort streaming requests
  currentStreamController: null,
  // flag set when stream was aborted (manual or automatic)
  streamAborted: false,
      messages: [],
      selectedVisionModel: 'qwen2.5vl:latest',
      task: 'ocr',
      searchObject: '',
      questionPrompt: '',
      boxes: [],
  ocrText: '',
  tableData: { headers: [], rows: [] },
  showLightbox: false,
  // streaming UI
  streamContent: '',
  streamContentAssembled: '',
  streamPanelActive: [0],
  streamEnabled: true,
  // chat history for question task (sent to chat completion)
  chatMessages: [],
  previewWidth: 300,
  previewHeight: 200,
  imageNaturalWidth: null,
  imageNaturalHeight: null,
  canvasWidth: 300,
  canvasHeight: 200,
    };
  },
  computed: {
    // default endpoint for high-quality model and general use
    defaultGenerateUrl() {
      return 'http://10.13.34.181:11434/api/generate';
    }
  ,
    // messages in reverse order so latest appears on top for chat UI
    reversedMessages() {
      return (this.messages || []).slice().reverse();
    }
  },
  methods: {
    // resolve generate URL based on selected model: try primary fast IP then fallback
    async resolveGenerateUrl() {
      // for fast model try primary IP then fallback
      if (this.selectedVisionModel === 'qwen2.5vl:latest') {
        const primary = 'http://10.13.33.50:11434/api/generate';
  const fallback = this.defaultGenerateUrl;
        try {
          // quick probe to primary with timeout; treat any HTTP response (including 405) as available
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), 1500);
          const resp = await fetch(primary, { method: 'OPTIONS', signal: controller.signal });
          clearTimeout(to);
          // if we got a response object, consider primary available (even 405)
          if (resp && (resp.ok || resp.status === 405 || resp.status === 204 || resp.status === 200)) {
            return primary;
          }
          // otherwise fallback
          return fallback;
        } catch (e) {
          // network error or timeout -> fallback
          return fallback;
        }
      }
      // otherwise use default
  return this.defaultGenerateUrl;
    },
    triggerFileInputDialog() {
      this.$refs.fileInput.click();
    },
    onQuestionKeydown(e) {
      // Enter to submit chat (unless Shift is held); Shift+Enter inserts newline.
      const isEnter = e.key === 'Enter' || e.code === 'Enter';
      if (!isEnter) return;
      if (e.shiftKey) {
        // allow newline
        return;
      }
      // Support Ctrl/Cmd+Enter as well
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      if (isEnter && !e.shiftKey) {
        e.preventDefault();
        this.submitQuestion();
      } else if (isEnter && isCtrlCmd) {
        e.preventDefault();
        this.submitQuestion();
      }
    },
    submitQuestion() {
      if (this.task !== 'question') return;
      const q = (this.questionPrompt || '').trim();
      if (!q) return;
  // append user's question to UI messages (chat style)
  this.messages.push({ title: 'Question', content: `<pre>${this.escapeHtml(q)}</pre>` });
  // also add to chatMessages history to send to chat completion
  this.chatMessages.push({ role: 'user', content: q });
  // clear input for next question
  this.questionPrompt = '';
  // call visionRequest (no override needed since chat history is used)
  this.visionRequest(q);
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.setPastedImage(ev.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    handleDrop(e) {
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => this.setPastedImage(ev.target.result);
      reader.readAsDataURL(file);
    },
    pasteHint() {
      // focus and rely on document.onpaste handler in mounted
      this.$refs.fileInput && this.$refs.fileInput.focus && this.$refs.fileInput.focus();
    },
    setPastedImage(dataUrl) {
      this.pasted64 = dataUrl;
      // estimate preview width/height
      const img = new Image();
      img.onload = () => {
        const maxW = 350;
        const ratio = img.width / img.height;
  this.previewWidth = Math.min(maxW, img.width);
  this.previewHeight = Math.round(this.previewWidth / ratio);
  // store natural size for normalization
  this.imageNaturalWidth = img.width;
  this.imageNaturalHeight = img.height;
  // set default canvas size to fit response card width (use response container width if available)
  this.$nextTick(() => {
    const container = this.$refs.resultContainer;
    const containerWidth = container && container.clientWidth ? container.clientWidth : this.previewWidth;
    // preserve image aspect ratio
    const cw = Math.min(containerWidth, img.width, 800);
    const ch = Math.round(cw / ratio);
    this.canvasWidth = cw;
    this.canvasHeight = ch;
    // also set preview to match smaller canvas for consistent overlay
    this.previewWidth = Math.min(this.previewWidth, cw);
    this.previewHeight = Math.round(this.previewWidth / ratio);
  });
      };
      img.src = dataUrl;
      // clear previous boxes/messages
      this.boxes = [];
      this.messages = [];
    },
    boxStyle(b) {
      // expect b: { x, y, w, h } in percent (0-1) or absolute px
      return {
        position: 'absolute',
        left: (b.x * 100) + '%',
        top: (b.y * 100) + '%',
        width: (b.w * 100) + '%',
        height: (b.h * 100) + '%',
        border: '2px solid rgba(255,0,0,0.8)',
        boxSizing: 'border-box',
        pointerEvents: 'none'
      };
    },
  // accept an optional question override so submitQuestion can supply the prompt after clearing input
  async visionRequest(questionOverride) {
      if (!this.pasted64) {
        this.messages.unshift({ title: 'Error', content: 'Please provide an image (upload/paste/drop).' });
        return;
      }

      this.isProcessing = true;
      this.messages.unshift({ title: 'Info', content: 'Processing...' });

      // build prompt by task
      let prompt = '';
      if (this.task === 'ocr') {
        prompt = 'Perform OCR on the supplied image and return plain text only.';
      } else if (this.task === 'table') {
        prompt = 'Extract any tables from the image and return strictly JSON with the shape: { "table": [ [header1, header2, ...], [row1col1, row1col2, ...], ... ] }. Return only JSON with a top-level "table" field.';
      } else if (this.task === 'search') {
        // ask the model to return strict JSON with absolute bbox_2d in pixels relative to the original image size
        const objName = this.searchObject ? ` for object "${this.searchObject}"` : '';
        prompt = `Detect objects${objName} in the image and return strictly JSON with the shape: { "boxes": [{ "bbox_2d": [x1, y1, x2, y2], "label": "..." }, ...] }. Coordinates must be absolute pixels relative to the original image (not normalized). Only return JSON.`;
      } else if (this.task === 'question') {
        const q = questionOverride || this.questionPrompt || 'Answer questions about the image. Provide concise answers.';
        prompt = (q) + '\nReturn plain text.';
      }

      // build request body; for question task use chat-style messages so history/context is preserved
      let body = null;
      if (this.task === 'question') {
        // use chat completion style - include previous chatMessages history
          // convert task instructions into a system message rather than a prompt
          const sysInstruction = (() => {
            if (this.task === 'ocr') return 'Perform OCR on the supplied image and return plain text only.';
            if (this.task === 'table') return 'Extract any tables from the image and return strictly JSON with the shape: { "table": [ [header1, header2, ...], [row1col1, row1col2, ...], ... ] }. Return only JSON with a top-level "table" field.';
            if (this.task === 'search') {
              const objName = this.searchObject ? ` for object "${this.searchObject}"` : '';
              return `Detect objects${objName} in the image and return strictly JSON with the shape: { "boxes": [{ "bbox_2d": [x1, y1, x2, y2], "label": "..." }, ...] }. Coordinates must be absolute pixels relative to the original image (not normalized). Only return JSON.`;
            }
            // question default system instruction
            return 'Answer questions about the image. Provide concise answers.';
          })();

          // build role-based messages for all tasks: system instruction first
          if (this.task === 'question') {
            // chat-style: system + history + user
            // Ollama expects images to be attached per-message (inside message.images) for /api/chat.
            const userMsg = { role: 'user', content: prompt };
            if (this.pasted64) {
              userMsg.images = [this.pasted64.split(',')[1]];
            }
            body = {
              model: this.selectedVisionModel,
              messages: [{ role: 'system', content: sysInstruction }].concat(this.chatMessages || []).concat([userMsg]),
              stream: !!this.streamEnabled,
              options: { temperature: 0 }
            };
          } else {
            // non-chat tasks: still send messages with a system instruction and a user indicating 'process this image'
            body = {
              model: this.selectedVisionModel,
              messages: [{ role: 'system', content: sysInstruction }, { role: 'user', content: 'Process the provided image.' }],
              images: this.pasted64 ? [this.pasted64.split(',')[1]] : [],
              stream: !!this.streamEnabled,
              options: { temperature: 0 }
            };
          }
      } else {
        body = {
          model: this.selectedVisionModel,
          prompt: prompt,
          images: [this.pasted64.split(',')[1]],
          stream: !!this.streamEnabled,
          options: { temperature: 0, 
            repeat_penalty: 1.5,
            presence_penalty: 2.0,
            top_p: 0.7,
            repeat_last_n: 128
           }
        };
      }

      // Only request JSON for table/search tasks. OCR and Question should return plain text.
      if (this.task === 'search' || this.task === 'table') {
        body.format = 'json';
      }

      // resolve endpoint (handles fast-model primary then fallback)
      let endpoint = await this.resolveGenerateUrl();
      // if using question/chat mode, prefer a chat endpoint path
      if (this.task === 'question') {
        endpoint = endpoint.replace('/api/generate', '/api/chat');
      }
      // update messages or UI reference during processing
      this.messages[0] = { title: 'Info', content: `Processing... (API: ${endpoint})` };

  // clear stream area and open panel
  this.streamContent = '';
  this.streamContentAssembled = '';
  this.streamPanelActive = [0];

      // create an AbortController so we can stop long-running/looping streams
      const controller = new AbortController();
      this.currentStreamController = controller;
      this.streamAborted = false;
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        // if readable stream is available, stream chunks into streamContent
        let data = undefined;
                if (resp.body && typeof resp.body.getReader === 'function') {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          // buffer for assembling JSON objects from newline-delimited stream
          let ndjsonBuffer = '';
          // accumulate only the 'response' fields from each streamed JSON line
                  let responseBuf = '';
          // repeating-piece detection: keep last piece and a counter to detect looping output
          let lastPiece = null;
          let repeatCount = 0;
          const REPEAT_THRESHOLD = 8; // abort if same chunk repeated this many times
          const MAX_STREAM_CHARS = 200000; // abort if stream grows too large
          while (!done) {
            const { value, done: d } = await reader.read();
            done = d;
              if (value) {
              const chunk = decoder.decode(value, { stream: !done });
              // append to raw streamContent for UX visibility
              this.streamContent += chunk;
              // accumulate into NDJSON buffer and attempt to split lines
              ndjsonBuffer += chunk;
              const lines = ndjsonBuffer.split(/\r?\n/);
              // keep last partial line in buffer
              ndjsonBuffer = lines.pop();
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                          const obj = JSON.parse(trimmed);
                          // sample formats: { response: '...' } or { message: { role:'assistant', content:'...' } }
                          let piece = '';
                          if (obj) {
                            if (obj.message && typeof obj.message.content === 'string') piece = obj.message.content;
                            else if (typeof obj.response === 'string') piece = obj.response;
                            else if (obj.message && obj.message.role === 'assistant' && typeof obj.message === 'string') piece = obj.message;
                          }
                          if (piece) {
                            responseBuf += piece;
                            // update assembled stream content live for the panel
                            this.streamContentAssembled = responseBuf;
                            // detect repeating pieces (simple heuristic)
                            if (piece === lastPiece) {
                              repeatCount += 1;
                            } else {
                              lastPiece = piece;
                              repeatCount = 0;
                            }
                            // if repetition or overly large stream, abort the request
                            if (repeatCount >= REPEAT_THRESHOLD || responseBuf.length > MAX_STREAM_CHARS) {
                              this.streamAborted = true;
                              try { controller.abort(); } catch (e) {}
                              // stop processing further
                              done = true;
                              break;
                            }
                          }
                } catch (e) {
                  // ignore parse errors for incomplete fragments
                }
              }
            }
          }
          // after stream finishes, include any remaining buffered line
          if (ndjsonBuffer && ndjsonBuffer.trim()) {
                    try {
                      const obj = JSON.parse(ndjsonBuffer.trim());
                      let piece = '';
                      if (obj) {
                        if (obj.message && typeof obj.message.content === 'string') piece = obj.message.content;
                        else if (typeof obj.response === 'string') piece = obj.response;
                      }
                      if (piece) {
                        responseBuf += piece;
                        this.streamContentAssembled = responseBuf;
                      }
                    } catch (e) {
                      // ignore
                    }
          }
          // set streamContent to the assembled readable text for UX (already appended incrementally)
          // expose the assembled response buffer for downstream parsing
          this.streamContentAssembled = responseBuf;
          // try parse assembled buffer as JSON (table/search may stream JSON)
          try {
            data = responseBuf ? JSON.parse(responseBuf) : undefined;
          } catch (e) {
            // not JSON, leave data undefined and downstream will treat it as plain text
          }
  } else {
          data = await resp.json();
          // non-stream fallback: populate stream area with response text if available
          if (data) {
            if (data.message && typeof data.message.content === 'string') {
              this.streamContentAssembled = data.message.content;
              this.streamContent = data.message.content;
            } else if (data.response) {
              const txt = typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2);
              this.streamContentAssembled = txt;
              this.streamContent = txt;
            }
          }
        }

        // model may return JSON string in data.response or via assembled stream
        let parsed = null;
        // choose finalText in this order: explicit data.response (non-stream), assembled stream JSON, full streamContent text
        const finalTextCandidate = (typeof data !== 'undefined' && data && data.response) ? data.response : (this.streamContentAssembled || this.streamContent || '');
        try {
          parsed = typeof finalTextCandidate === 'string' ? JSON.parse(finalTextCandidate) : finalTextCandidate;
        } catch (e) {
          // fallback: try to find JSON within the string
          try {
            const s = finalTextCandidate || '';
            const jsonStart = s.indexOf('{');
            const jsonEnd = s.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              parsed = JSON.parse(s.substring(jsonStart, jsonEnd + 1));
            } else {
              parsed = { text: finalTextCandidate };
            }
          } catch (e2) {
            parsed = { text: finalTextCandidate };
          }
        }

        // handle task-specific outputs
        if (this.task === 'ocr') {
          const out = parsed.output || parsed.text || data.response || '';
          // populate editable OCR textarea
          this.ocrText = String(out);
          // clear messages list
          this.messages = [];
        } else if (this.task === 'table') {
          // Prefer explicit table array in parsed JSON
          let tbl = parsed && (parsed.table || parsed.tables || parsed.data) ? (parsed.table || parsed.tables || parsed.data) : null;
          // If parsed is a plain string, try to parse JSON inside
          if (!tbl && typeof parsed === 'string') {
            try {
              const p2 = JSON.parse(parsed);
              tbl = p2.table || p2.tables || p2.data || null;
            } catch (e) {
              // not JSON - fallthrough to CSV/text parsing
            }
          }

          if (Array.isArray(tbl) && tbl.length > 0) {
            const headers = Array.isArray(tbl[0]) ? tbl[0].map(h => String(h || '')) : [];
            const rows = tbl.slice(1).map(r => Array.isArray(r) ? r.map(c => String(c || '')) : []);
            this.tableData = { headers, rows };
            this.messages = [];
          } else {
            // fallback: if parsed contains text, try CSV parse
            const raw = parsed.output || parsed.text || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
            // simple CSV parse: split lines, split by comma or tab
            const lines = String(raw).trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
            if (lines.length > 0) {
              const rows = lines.map(line => line.split(/\t|,\s*/).map(cell => cell.replace(/^\"|\"$/g, '').trim()));
              const headers = rows.length > 0 ? rows[0] : [];
              const body = rows.length > 1 ? rows.slice(1) : [];
              this.tableData = { headers, rows: body };
              this.messages = [];
            } else {
              const out = raw;
              this.messages.unshift({ title: 'Extracted Table', content: `<pre>${this.escapeHtml(out)}</pre>` });
              this.tableData = { headers: [], rows: [] };
            }
          }
        } else if (this.task === 'search') {
          // expect parsed.boxes = [{bbox_2d:[x1,y1,x2,y2], label},...]
          const boxesRaw = parsed.boxes || parsed.bboxes || parsed.bounding_boxes || [];
          if (Array.isArray(boxesRaw) && boxesRaw.length > 0) {
            const normalized = [];
            for (const b of boxesRaw) {
              if (b && Array.isArray(b.bbox_2d) && b.bbox_2d.length === 4 && this.imageNaturalWidth && this.imageNaturalHeight) {
                const [x1, y1, x2, y2] = b.bbox_2d.map(Number);
                // Convert absolute pixel coordinates to normalized [0,1]
                const nx = Math.max(0, Math.min(1, x1 / this.imageNaturalWidth));
                const ny = Math.max(0, Math.min(1, y1 / this.imageNaturalHeight));
                const nxe = Math.max(0, Math.min(1, x2 / this.imageNaturalWidth));
                const nye = Math.max(0, Math.min(1, y2 / this.imageNaturalHeight));
                const nw = Math.max(0, nxe - nx);
                const nh = Math.max(0, nye - ny);
                normalized.push({ x: nx, y: ny, w: nw, h: nh, label: b.label || '' });
              } else if (b && typeof b.x === 'number' && typeof b.w === 'number') {
                // already normalized
                normalized.push({ x: b.x, y: b.y, w: b.w, h: b.h, label: b.label || '' });
              }
            }

            if (normalized.length > 0) {
              this.boxes = normalized;
              this.messages.unshift({ title: 'Search Result', content: `Found ${this.boxes.length} item(s).` });
              this.$nextTick(() => this.drawBoxesOnCanvas());
            } else {
              this.boxes = [];
              this.clearCanvas();
              this.messages.unshift({ title: 'Search Result', content: 'No objects found (unable to parse boxes).' });
            }
          } else {
            this.boxes = [];
            this.clearCanvas();
            this.messages.unshift({ title: 'Search Result', content: 'No objects found.' });
          }
        } else if (this.task === 'question') {
          const out = parsed.output || parsed.answer || parsed.text || JSON.stringify(parsed, null, 2);
          // remove any temporary Processing info messages before appending answer
          this.messages = this.messages.filter(m => !(m.title === 'Info' && typeof m.content === 'string' && m.content.startsWith('Processing')));
          this.messages.push({ title: 'Answer', content: `<pre>${this.escapeHtml(out)}</pre>` });
          // scroll to bottom so latest Q/A is visible
          this.$nextTick(() => {
            const el = this.$refs.responseList;
            try {
              if (el && el.$el) el.$el.scrollTop = el.$el.scrollHeight;
            } catch (e) {}
          });
        }
      } catch (err) {
        console.error(err);
        if (err && err.name === 'AbortError') {
          const reason = this.streamAborted ? 'aborted (repeating or manual stop)' : 'aborted';
          this.messages.unshift({ title: 'Info', content: `Stream ${reason}. Partial output shown.` });
        } else {
          this.messages.unshift({ title: 'Error', content: this.escapeHtml(err.message || String(err)) });
        }
      } finally {
        this.isProcessing = false;
        // clear controller
        try { this.currentStreamController = null; } catch (e) {}
        // scroll response list
        this.$nextTick(() => {
          const el = this.$refs.responseList;
          if (el && el.$el) el.$el.scrollTop = 0;
        });
      }
    },
    // manual abort called from UI
    abortStream() {
      if (this.currentStreamController) {
        try {
          this.streamAborted = true;
          this.currentStreamController.abort();
          this.messages.unshift({ title: 'Info', content: 'User requested stop (abort).' });
        } catch (e) {
          console.error('Abort failed', e);
        }
      }
    },
    copyOcrText() {
      if (!this.ocrText) return;
      try {
        navigator.clipboard.writeText(this.ocrText);
        this.messages.unshift({ title: 'Info', content: 'OCR text copied to clipboard.' });
      } catch (e) {
        this.messages.unshift({ title: 'Error', content: 'Copy failed.' });
      }
    },
    copyTableAsTSV() {
      if (!this.tableData || !this.tableData.headers || !this.tableData.headers.length) return;
      const rows = [this.tableData.headers].concat(this.tableData.rows || []);
      // produce TSV
      const tsv = rows.map(r => r.map(c => String(c).replace(/\t/g, ' ')).join('\t')).join('\n');
      try {
        navigator.clipboard.writeText(tsv);
        this.messages.unshift({ title: 'Info', content: 'Table copied (TSV) - paste into Excel.' });
      } catch (e) {
        this.messages.unshift({ title: 'Error', content: 'Copy failed.' });
      }
    },
    escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    drawBoxesOnCanvas() {
      const canvas = this.$refs.resultCanvas;
      if (!canvas) return;
    // ensure canvas pixel dimensions match desired size
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
      // draw image first
      if (this.pasted64) {
        const img = new Image();
        img.onload = () => {
          // fit image to canvas size
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // then draw boxes
          ctx.lineWidth = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) / 200));
          ctx.strokeStyle = 'rgba(0,255,0,0.9)';
          ctx.fillStyle = 'rgba(0,255,0,0.2)';
          ctx.font = '14px Arial';
          this.boxes.forEach(b => {
            const x = b.x * canvas.width;
            const y = b.y * canvas.height;
            const w = b.w * canvas.width;
            const h = b.h * canvas.height;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            if (b.label) {
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              ctx.fillRect(x, y - 20, ctx.measureText(b.label).width + 8, 20);
              ctx.fillStyle = 'white';
              ctx.fillText(b.label, x + 4, y - 5);
              ctx.fillStyle = 'rgba(0,255,0,0.2)';
            }
          });
        };
        img.src = this.pasted64;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    clearCanvas() {
      const canvas = this.$refs.resultCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    clearChat() {
      this.messages = [];
      this.chatMessages = [];
      this.streamContentAssembled = '';
      this.streamContent = '';
    },
    chatReset() {
      this.pasted64 = null;
      this.messages = [];
      this.boxes = [];
  this.tableData = { headers: [], rows: [] };
      this.searchObject = '';
      this.questionPrompt = '';
  this.chatMessages = [];
    }
  },
  mounted() {
    // clipboard paste handler
    document.addEventListener('paste', (ev) => {
      const items = ev.clipboardData && ev.clipboardData.items ? ev.clipboardData.items : [];
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (e) => this.setPastedImage(e.target.result);
          reader.readAsDataURL(blob);
          ev.preventDefault();
          break;
        }
      }
    });
  }
  ,
  watch: {
    task(newVal, oldVal) {
      // reset response area when task changes
      this.messages = [];
      this.boxes = [];
  this.clearCanvas();
  this.tableData = { headers: [], rows: [] };
    }
  }
};
</script>

<style scoped>
.dropZone {
  border: 2px dashed #bbb;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  min-height: 180px;
  position: relative;
}
.dropInner { position: relative; }
.overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 900; }
.box { pointer-events: none; }

/* shimmer effect shown during processing */
.shimmer {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(104, 255, 255, 0.5) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer-slide 1.2s linear infinite;
  border-radius: 6px;
  z-index: 1000;
}

@keyframes shimmer-slide {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
}

.result-area { display:flex; flex-direction:column; align-items:center; overflow: hidden; }
.result-area .result-scroll { width:100%; overflow-y: auto; max-height: calc(100vh - 180px); padding-right: 8px; }
.result-canvas { border: 1px solid #eee; max-width: 100%; height: auto; background: #fafafa; }

.eye-btn { box-shadow: 0 1px 6px rgba(0,0,0,0.25); border-radius:4px; }

/* OCR ruled lines: subtle repeated linear-gradient background inside container */
.ocr-container {
  position: relative;
}
.ocr-container .v-input__control .v-input__slot {
  /* use a subtle lined-paper look via background image */
  background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 100% 28px; /* line height spacing */
}

/* chat UI styles */
.chat-box { width: 100%; }
.chat-messages { display:flex; flex-direction:column-reverse; }
.chat-message { max-width: 100%; }
.chat-user { background: #e3f2fd; align-self: flex-end; }
.chat-bot { background: #f5f5f5; align-self: flex-start; }
.chat-title { opacity: 0.8; font-size: 0.85em; }
</style>
<style scoped>
.vision-card { display: flex; flex-direction: column; }
.full-height-card { height: 90vh; display:flex; flex-direction:column; }
.vision-body { flex: 1 1 auto; overflow: hidden; }
.vision-scroll { height: calc(100vh - 160px); overflow-y: auto; padding-bottom: 12px; }
.vision-footer { position: sticky; bottom: 0; background: white; padding: 12px; border-top: 1px solid #eee; }

/* table styles */
.result-table { width: 100%; }
/* ensure the actual table element inside v-simple-table occupies full width */
.result-table table { width: 100% !important; table-layout: fixed; border-collapse: collapse; }
.result-table th { background: #f5f5f5; text-align: left; padding: 8px 12px; border-bottom: 1px solid #eaeaea !important; }
.result-table td { padding: 8px 12px; border-bottom: 1px solid #eaeaea !important; }
/* add row borders and alternating background */
.result-table tbody tr { border-bottom: 1px solid #eaeaea !important; }
.result-table tbody tr:nth-child(odd) { background: #fff; }
.result-table tbody tr:nth-child(even) { background: #fbfbfb; }

/* response footer layout */
.response-footer { position: sticky; bottom: 0; background: white; padding: 8px 12px; border-top: 1px solid #eee; }
/* make table header sticky within the scrollable table area */
.result-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* scrollable table container */
.table-scroll {
  width: 100%;
  max-height: 420px; /* allow the table to scroll when large */
  overflow: auto;
}
/* ensure sticky header is visually above scrolling content */
.table-scroll thead th { position: sticky; top: 0; z-index: 20; background: #f5f5f5; }
</style>