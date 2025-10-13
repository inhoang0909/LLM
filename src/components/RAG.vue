<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-toolbar color="primary" >
                <v-toolbar-title>{{ `RAG | ${model}` }}</v-toolbar-title>
                <v-row class="pt-6">
                  <v-col cols="5">
                    <v-radio-group class="pt-5 d-inline" v-model="renderMode" inline>
                      <v-radio value="md" label="Markdown"></v-radio>
                      <v-radio value="plain" label="Plain Text"></v-radio>
                    </v-radio-group>
                  </v-col>
                </v-row>
              </v-toolbar>
              <v-card-text style="height: 70vh;">
                <v-list three-line style="overflow-y: auto; height: 68vh; border: 1px solid #ccc; border-radius: 5px;" id="chatWrapper" ref="chatWrapper">
                  <template v-for="(message, mIndex) in messages.contents" :key="mIndex">
                    <v-list-item v-if="message.show" class="mb-1">
                      <v-list-item-title class="text-uppercase">
                        <v-btn size="x-small" :color="message.role === 'user'?'primary':'red'" variant="outlined">{{ message.role }}</v-btn>
                      </v-list-item-title>
                      <v-card class="mt-1">
                        <v-card-text v-if="isStream && mIndex === (messages.contents.length - 1)" style="border: 1px solid #ccc; border-radius: 5px;" class="px-8">
                          <div v-if="renderMode === 'md'" v-html="parseMarkdown(streamChunkComp)"></div>
                          <div v-else v-html="streamChunkComp"></div>
                        </v-card-text>
                        <v-card-text v-else style="border: 1px solid #ccc; border-radius: 5px;" class="px-8">
                          <div v-if="renderMode === 'md'" v-html="parseMarkdown(message.content)"></div>
                          <div v-else v-html="message.content"></div>
                        </v-card-text>
                      </v-card>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols='6'>
            <v-select
            v-model="qDrant.selected"
            :items="qDrant.collections"
            label="Select Qdrant Collection"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <VTextField v-model="qDrant.selected" label="Collection name"></VTextField>
          </v-col>
          <v-col cols="2">
            <v-btn color="primary" class="mb-1" @click="triggerFileInputDialog" icon="mdi-paperclip"></v-btn>
            <v-btn color="red" @click="chatReset" icon="mdi-delete-circle-outline"></v-btn>
            <input ref="fileInput" class="d-none" type="file" @change="handleFileUpload">
          </v-col>
          <v-col cols="10">
            <v-textarea rows="3" label="Type your message" @keydown="keyPressHandler" v-model="userInput" append-icon="mdi-send" @click:append="postChat"></v-textarea >
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </template>
  <script>
  import {Ollama} from "ollama/browser";
  import MarkdownIt from 'markdown-it'; 
  import Papa from 'papaparse';
  var chatWrapper;
  const ollama = new Ollama({
    // host: 'http://10.13.34.154:11434'
    host: 'http://10.13.34.154:11435'
  })
  export default {
    data() {
      return {
        ollama,
        qDrant: {
          api: 'http://10.13.34.154:6333',
          collections: [],
          selected:null,
          context: '',
          maxEntries: 3,
        },
        userInput: 'Công ty Can Sports Việt Nam được thành lập khi nào?',
        stream: '',
        streamChunk: [],
        messages: {
          title: null,
          contents: [{
            role: 'system',
            content: 'Bạn là một trợ lý AI thông minh của công ty Can Sports Việt Nam, hãy giúp tôi trả lời câu hỏi của người dùng. Chỉ dựa vào ngữ cảnh bạn được cung cấp để trả lời câu hỏi của họ. Không bao giờ tự tạo ra thông tin mới. Nếu không thể trả lời, hãy thông báo cho người dùng [Thông tin bạn đang yêu cầu tôi chưa được cập nhật, vui lòng thử lại sau !]. Chỉ trả lời bằng tiếng Việt.',
            show: false,
            inContext: true,
          }],
        },
        selectedItem: null,
        isStream: false,
        model: 'llama3:latest',
        modelListing: [],
        renderMode: 'md', // md or plaintext
        cmdListing: ['/?', '/help', '/clear', '/new', '/stop'],
        isWaiting: true,
        ragFile: null,
        modelOptions: {
          temperature: 0.1,
          stop: ['::END','�','[DONE]'],
        },
      };
    },
    methods: {
      async postChat(){
        // embebding the userInput 
        // await this.doEmbedingTask('user',this.userInput);
        let _this = this;
        await this.getEmbedding(this.userInput).then(async data =>{
          await this.qdrantFindSimiliar(data,'qa_vn').then(async rData =>{
            let _r = rData.result.map(x => JSON.parse(x.payload.content).ref);
            // let _r as unique value only
            let _rUnique = [...new Set(_r)].filter(x => x);
            console.log(_rUnique);
            let ctxs=[];
            if(_rUnique.length > 1){
              console.log('more than 1');
              Promise.all(_rUnique.map(x => this.getEmbedding(x))).then((values) => {
                ctxs = values;
                this.qdrantFindSimiliarInBatch(ctxs,'st_vn').then(rData => {
                  // console.log(rData);
                  // concat all the array inside rData.result
                  // flat and make the value as unique
                  let _r = [...new Set([].concat(...rData.result.map(x => x.map(y => y.payload.content))))];
                  this.qDrant.context = _r.join('\n\n____');
                  this.sendMessage();
                  console.log(_r);
                  
                });
              });
            } else {
              console.log('only 1');
              await this.getEmbedding(_rUnique[0]).then(e =>{
                this.qdrantFindSimiliar(e,'st_vn').then(rData => {
                  // console.log(rData);
                  let _r = rData.result.map(x => x.payload.content);
                  this.qDrant.context = _r.join('\n\n____');
                  this.sendMessage();
                  console.log(_r);
                });
              })
            }

          });
        });
      },
      async chat() {
        let _this = this;
        this.streamChunk = [];
        this.isStream = true;
        this.isWaiting = true;
        try {
          const response = await this.ollama.chat({
            model: this.model,
            messages: this.messages.contents.filter(x => x.inContext),
            options: this.modelOptions,
            stream: true
          })
          for await (const part of response) {
            this.streamChunk.push(part.message.content);
            // console.log(part.message.content);
          }
          this.addToMessages();
        } catch (error) {
          console.error(error);
          _this.isStream = false;
          _this.isWaiting = false;
        }
      },
      async sendMessage() {
        // if newsession is in cmdListing
        if(this.cmdListing.includes(this.userInput)){
          switch (this.userInput) {
            case '/new':
            this.newChatSession();
            this.showNotify('New chat session is ready');
            break;
            case '/stop':
            this.stopStreaming();
            this.showNotify('Chat stopped');
            break;
            case '/clear':
            this.messages.contents = [{
              role: 'system',
              content: this.systemPrompt.prompt,
              show: false,
              inContext: true,
            }];
            this.showNotify('Chat cleared');
            break;
            case '/?':
            case '/help':
            this.messages.contents.push({
              role: 'assistant',
              content: 'Available commands: /new, /stop, /clear, /?, /help',
              show: true,
              inContext: false,
            });
            break;
            default:
            break;
          }
          this.userInput = '';
          return;
        } else {
          if (this.userInput.trim() !== '') {
            // update the context to the first message as role = system only
            this.messages.contents[0] = {
              role: 'system',
              content: this.qDrant.context,
              content_plain: this.qDrant.context,
              show: false,
              inContext: true,
            }
            this.messages.contents.push({
              role: 'user',
              content: this.userInput,
              content_plain: this.userInput.replace(/\n/g, '<br/>'),
              show: true,
              inContext: true,
            });
            this.messages.contents.push({
              role: 'assistant',
              content: '',
              show: true,
              inContext: true,
            });
            if(this.chatMode === 'newChat'){
              await this.generateChatTitle();
              this.chatMode = 'oldChat';
            }
            await this.chat();
          }
        }
      },
      addToMessages() {
        this.messages.contents[this.messages.contents.length - 1].content = this.streamChunkComp;
        this.isStream = false;
        this.isWaiting = false;
        this.userInput = '';
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
            this.userInput += '\n';
          } else {
            this.postChat();
            event.preventDefault();
          }
        }
      },
      async processingRAG(doc) {
        // csv parser using Papa
        Papa.parse(doc, {
          header: true,
          dynamicTyping: true,
          complete: async (results) => {
            // console.log(results.data);
            // [{question: 'Xưởng Trảng Bàng của công ty được thành lập khi nào?', answers: 'Tháng 7 năm 2011'}]
            // loop through the data and do the embedding by doEmbedingTask({question: 'Xưởng Trảng Bàng của công ty được thành lập khi nào?', answers: 'Tháng 7 năm 2011'})})
            for (let i = 0; i < results.data.length; i++) {
              await this.doEmbedingTask('qdrant',results.data[i]);
              // wait for 200ms before next loop
              await new Promise((resolve) => setTimeout(resolve, 100));
              console.log('done', i);
            }
          }
        });
      },
      handleFileUpload(event) {
        const file = event.target.files[0];
        this.processingRAG(file);
      },
      triggerFileInputDialog() {
        this.$refs.fileInput.click();
      },
      generateUUID() { // Public Domain/MIT
        var d = new Date().getTime();//Timestamp
        var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16;//random number between 0 and 16
          if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
          } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
          }
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      },
      async getQdrantCollections(){
        // fetching to http://10.13.34.154:6333/collections then return the collections
        let qApi = 'http://10.13.34.154:6333';
        let qUrl = `${qApi}/collections`;
        let qRes = await fetch(qUrl);
        let qData = await qRes.json();
        this.qDrant.collections = qData.result.collections.map(x => x.name);
      },
      async getEmbedding(content){
        let embeddingMdl = 'mxbai-embed-large:latest';
        let embeddingApi = 'http://10.13.34.154:11435/api/embeddings';
        let _e = await fetch(embeddingApi, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: embeddingMdl,
            prompt: content,
            keep_alive: -1,
          })
        }).then((response) => response.json())
        return _e.embedding;
      },
      async qdrantFindSimiliar(vector,collection) {
        let qdrandResponse = await fetch (this.qDrant.api + '/collections/'+collection+'/points/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vector,
            limit: this.qDrant.maxEntries,
            with_payload: true
          })
        }).then(response => response.json());
        return qdrandResponse;
      },
      async qdrantFindSimiliarInBatch(vectors,collection) {
        let batch = {
          searches: vectors.map(vector => ({
            vector,
            limit: this.qDrant.maxEntries,
            with_payload: true
          }))
        };
        let qdrandResponse = await fetch (this.qDrant.api + '/collections/'+collection+'/points/search/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch)
        }).then(response => response.json());
        return qdrandResponse;
      },
      syncToQdrantCollection(embedding, content){
        let QdrantApi = 'http://10.13.34.154:6333/collections/';
        let _points = {
          "points": [
          {
            "id": this.generateUUID(), 
            "vector": embedding,
            "payload": {content},
          }
          ],
        }
        fetch(QdrantApi + 'vnHandBook' + '/points?wait=true', {
          method: 'PUT',
          headers: {
            "accept": "application/json, text/plain, */*",
            "pragma": "no-cache" ,
            "api-key": "vg@llm",
          },
          body: JSON.stringify(_points)
        }).then(response => response.json())
        .then(data => {
          console.log('syncToQdrantCollection Success:', data);
        }).catch((error) => {
          console.error('syncToQdrantCollection Error:', error);
        });
      },
      
      // endofmethods
    },
    computed: {
      streamChunkComp() {
        return this.streamChunk.join('');
      },
    },
    watch: {
      isStream: function (val) {
        if (val) {
          chatWrapper.scrollTop = chatWrapper.scrollHeight;
        }
      },
    },
    activated() {
      this.getQdrantCollections();
      chatWrapper = document.getElementById('chatWrapper');
      setInterval(() => {
        if(this.isStream){
          chatWrapper.scrollTop = chatWrapper.scrollHeight;
        }
      }, 200);
    },
  };
</script>
<style>
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
  white-space: pre-wrap;
  /* Since CSS 2.1 */
  white-space: -moz-pre-wrap;
  /* Mozilla, since 1999 */
  white-space: -pre-wrap;
  /* Opera 4-6 */
  white-space: -o-pre-wrap;
  /* Opera 7 */
  word-wrap: break-word;
  /* Internet Explorer 5.5+ */
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
}
</style>