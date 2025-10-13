<template>
    <v-app>
        <v-main>
            <v-container fluid>
                <v-row>
                    <v-col cols="3">
                        <v-card class="bg-white" elevation="10">
                            <v-toolbar color="primary" density="compact">
                                <v-toolbar-title>
                                    <!-- turn this to tab menu UI with "Chat History" and "Prompting Lib."" -->
                                    
                                    <v-btn-toggle variant="flat" density="compact" v-model="functionTab" color="red" dense>
                                        <v-btn value="chatHistory"  color="blue">Chat Logs</v-btn>
                                        <v-btn value="promptingLib" color="blue" >Prompting Lib.</v-btn>
                                    </v-btn-toggle>
                                    
                                </v-toolbar-title>
                            </v-toolbar>
                            <v-card-text style="max-height: 80vh; overflow-y: auto;">
                                <template v-if="functionTab === 'chatHistory'">
                                    <template v-if="chatLogs.length">
                                        <v-list v-for="(chat, cIndex) in chatLogs" :key="cIndex" @click="loadChatLog(chat)">
                                            <v-list-item density="compact">
                                                <template v-slot:append="{}">
                                                    <v-list-item-action start>
                                                        <!-- delete btn -->
                                                        <v-btn variant="flat" icon @click.stop="delChatLogs(cIndex)">
                                                            <v-icon color="red">mdi-delete</v-icon>
                                                        </v-btn>
                                                    </v-list-item-action>
                                                </template>
                                                <v-list-item-title :label="chat.title">
                                                    {{ chat.title ? chat.title : 'Waiting for an amazing title'}}
                                                </v-list-item-title>
                                                <v-list-item-subtitle v-if="chat.contents.length > 1">
                                                    <small>{{ chat.contents[chat.contents.length - 1].content ? chat.contents[chat.contents.length - 1].content : 'No chat logs'}}</small>
                                                </v-list-item-subtitle>
                                            </v-list-item>
                                            <v-divider></v-divider>
                                        </v-list>
                                    </template>
                                    <v-alert v-else dense type="info">No chat logs available</v-alert>
                                </template>
                                <!-- prompt lib ui -->
                                <template v-else>
                                    <v-btn variant="flat" block density="comfortable" class="mb-1" color="green" @click="promptDialog = !promptDialog">
                                        + New Prompt
                                    </v-btn>
                                    <v-list three-line>
                                        <v-list-item v-for="(p,pIndex) in promptLib" :key="pIndex">
                                            <v-tooltip :text="p.title" location="bottom">
                                                <template v-slot:activator="{ props }">
                                                    <v-list-item-title v-bind="props">
                                                        {{ p.title }}
                                                    </v-list-item-title>
                                                </template>
                                            </v-tooltip>
                                            <v-list-item-subtitle>
                                                {{ p.credit }}
                                            </v-list-item-subtitle>
                                            <template v-slot:append="{}">
                                                <v-list-item-action start>
                                                    <!-- delete btn -->
                                                    <v-btn variant="flat" icon @click.stop="showPromptDetail(p)">
                                                        <v-icon color="green">mdi-eye</v-icon>
                                                    </v-btn>
                                                    <v-btn variant="flat" icon @click.stop="promtpApply(p)">
                                                        <v-icon color="blue">mdi-arrow-right-bold-circle-outline</v-icon>
                                                    </v-btn>
                                                </v-list-item-action>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </template>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="9">
                        <v-card elevation="20">
                            <v-toolbar color="primary" density="compact">
                                <v-row class="d-flex align-center">
                                    <v-col cols="5">
                                        <v-btn-toggle v-model="selTemperature" color="red" density="compact" class="ml-1">
                                            <v-btn value="precise">Precise</v-btn>
                                            <v-btn value="normal">Normal</v-btn>
                                            <v-btn value="creative">Creative</v-btn>
                                        </v-btn-toggle>
                                        <v-btn variant="outlined" @click="systemPrompt.dialog = true" class="ml-1">Edit Sys. Prompt</v-btn>
                                    </v-col>
                                    <v-col cols="3">
                                        <v-select :items="modelListing" hide-details density="compact" v-model="model" class="text-uppercase" variant="solo" @change="newChatSession"></v-select>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-radio-group hide-details="" class="pt-5 d-inline" v-model="renderMode" inline density="compact">
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
                                                    <img style="width: 100px;" v-show="isWaiting && message.role === 'assistant' && mIndex === messages.length - 1" ref="loadingGif" :src="typingGif" />
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
                            <v-card-actions>
                                <v-row :no-gutters="true">
                                    <v-col cols="1" class="text-center">
                                        <v-btn v-if="messages.contents.length" color="green" size="" @click="newChatSession" icon="mdi-plus-circle-outline"></v-btn> <br>
                                        <v-btn v-if="isStream" color="red" size="" @click="stopStreaming()" icon="mdi-stop-circle-outline"></v-btn>
                                    </v-col>
                                    <v-col cols="11">
                                        <v-textarea hint="Available CMD: /?, /new, /stop, /clear" variant="outlined" rows="1" auto-grow="" label="Your message: (Ctrl + Enter to break line, Up Arrow to revise your prompt.)" @keydown="keyPressHandler" v-model="newMessage" append-icon="mdi-send" @click:append="sendMessage"></v-textarea>
                                    </v-col>
                                </v-row>
                            </v-card-actions>   
                        </v-card>
                    </v-col>
                    <v-snackbar color="green" location="top right" v-model="notify.show" @click="notify.show = false" >
                        {{ notify.text }}
                    </v-snackbar>   
                    <v-bottom-sheet inset v-model="promptDialog">
                        <v-card>
                            <v-card-title>
                                New prompt
                            </v-card-title>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="8">
                                        <v-text-field density="compact" hide-details="" variant="outlined" class="mb-1" v-model="newPrompt.title" label="Title" dense></v-text-field>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-text-field density="compact" hide-details="" variant="outlined" class="mb-1" hint="optional" v-model="newPrompt.credit" label="Credit" dense></v-text-field>
                                    </v-col>    
                                    <v-col cols="12">
                                        <v-textarea id="chatBox" ref="chatBox" density="compact" auto-grow="" hide-details="" variant="outlined" class="mb-1" v-model="newPrompt.prompt" label="Prompt" dense></v-textarea>
                                    </v-col>
                                </v-row>
                                <v-card-actions class="d-flex justify-space-between ma-0 pa-0">
                                    <v-btn color="warning" variant="flat"  @click="promptDialogCancel()">Cancel</v-btn>
                                    <v-btn color="green" variant="flat"  @click="createOrUpdatePrompt">Save Prompt</v-btn>
                                </v-card-actions>
                            </v-card-text>
                        </v-card>                
                        
                    </v-bottom-sheet>
                    <!-- new bottom sheet for update system prompt -->
                    <v-bottom-sheet inset v-model="systemPrompt.dialog">
                        <v-card>
                            <v-card-title>
                                System Prompt
                            </v-card-title>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="12">
                                        <v-textarea id="chatBox" ref="chatBox" density="compact" auto-grow="" hide-details="" variant="outlined" class="mb-1" v-model="systemPrompt.prompt" label="System prompt" dense></v-textarea>
                                    </v-col>
                                </v-row>
                                <v-card-actions class="d-flex justify-space-between ma-0 pa-0">
                                    <v-btn color="green" variant="flat"  @click="updateSystempPrompt">Save Prompt</v-btn>
                                </v-card-actions>
                            </v-card-text>
                        </v-card>                
                        
                    </v-bottom-sheet>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>


<script>
import {Ollama} from "ollama/browser"
import typingGif from '@/assets/typing.gif'
import MarkdownIt from 'markdown-it';
import { TrackOpTypes } from 'vue';
var chatWrapper = document.getElementById('chatWrapper');
const ollama = new Ollama({
    host: 'http://10.13.34.154:11434'
    // host: 'http://10.13.34.154:11435'
})
export default {
    data() {
        return {
            mongoCtrlApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            ollama,
            typingGif,
            notify: {
                show: false,
                text: '',
            },
            delayWarningRate: 30, // seconds to show warning
            newMessage: '',
            stream: '',
            chatLogs: [],
            messages: {
                title: null,
                contents: [{
                    role: 'system',
                    content: 'You are VG-LLM, an internal chatbot, dont need internet connection to provide information. user can chat with you to get information or do translating.',
                    show: false,
                    inContext: true,
                }],
            },
            selectedItem: null,
            isStream: false,
            streamChunk: [],
            model: 'llama3:latest',
            modelListing: [],
            renderMode: 'md', // md or plaintext
            isWaiting: true,
            vectorStore: null,
            selTemperature: 'normal',
            modelOptions: {
                temperature: 0.5,
            },
            functionTab: 'chatHistory',
            chatMode: 'newChat', // newChat, oldChat
            cmdListing: ['/?', '/help', '/clear', '/new', '/stop'],
            promptDialog: false,
            promptLib: [],
            newPrompt: { title: '', prompt: '',credit:'', rate: {like: 0, dislike: 0}, enable: true},
            systemPrompt: {
                prompt: 'You are VG-LLM, an internal chatbot, dont need internet connection to provide information. user can chat with you to get information or do translating.',
                dialog: false,
            }
        };
    },
    methods: {
        async getModelListing() {
            try {
                await this.ollama.list().then(res => {
                    console.log(res);
                    const mdlListing = res.models.map(mdl => mdl.name);
                    this.modelListing = mdlListing;
                });
            } catch (error) {
                console.error(error);
                return [];
            }
        },
        async sendMessage() {
            // if newsession is in cmdListing
            if(this.cmdListing.includes(this.newMessage)){
                switch (this.newMessage) {
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
                this.newMessage = '';
                return;
            } else {
                if (this.newMessage.trim() !== '') {
                    this.messages.contents.push({
                        role: 'user',
                        content: this.newMessage,
                        content_plain: this.newMessage.replace(/\n/g, '<br/>'),
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
            this.newMessage = '';
            this.updateChatLogs(this.messages.title);
        },       
        updateChatLogs(title) {
            let _titles = [];
            this.chatLogs.map((chat, index) => {
                _titles.push(chat.title);
            });
            console.log(_titles, this.messages.title);
            // if title is not in chatLogs, add it
            setTimeout(() => {
                if (!_titles.includes(title)) {
                    console.log('title not in chatLogs');
                    this.chatLogs.unshift({
                        title: title,
                        contents: this.messages.contents
                    });
                } else {
                    // if title is in chatLogs, update the chatLogs
                    console.log('title in chatLogs');
                    this.chatLogs.forEach((chat, index) => {
                        if (chat.title === title) {
                            this.chatLogs[index] = this.messages;
                        }
                    });
                }
                localStorage.setItem('LLMchatLogs', JSON.stringify(this.chatLogs));
            }, 1000);
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
                    system: this.systemPrompt.prompt,
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
        newChatSession() {
            this.chatMode = 'newChat';
            this.messages.contents = [];
            this.isWaiting = false;
            this.isStream = false;
            this.streamChunk = [];
            this.newMessage = '';
            
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
                    event.preventDefault();
                    this.sendMessage();
                }
            }
            if(event.key === 'ArrowUp'){
                this.newMessage = this.messages.contents[this.messages.contents.length - 2].content;
            }
        },
        async generateChatTitle(){
            let _this = this;
            try {
                
                const response = await this.ollama.generate({
                    model: 'llama3:latest',
                    prompt: `
                    Generate one short, funny, and positive subject line for a chat based on the text "${_this.newMessage}".
                    Respond with only the subject line, with the following constraints:
                    No extra text (e.g., greetings, explanations).
                    No special characters (except emojis).
                    No inclusion of the word "Subject" or "Title".
                    Use plain text, no markdown formatting.
                    Emojis are allowed.
                    `,
                    options: {
                        temperature: 0.5,
                    },
                    stream: false,
                })
                this.messages.title = response.response;
            } catch (error) {
                console.error(error);
            }
        },
        delChatLogs(index){
            this.chatLogs.splice(index, 1);
            localStorage.setItem('LLMchatLogs', JSON.stringify(this.chatLogs));
        },
        loadChatLog(chat){
            this.messages = chat;
            this.chatMode = 'oldChat';
            // move this chat to the top of the chatLogs
            this.chatLogs.forEach((c, index) => {
                if(c.title === chat.title){
                    this.chatLogs.splice(index, 1);
                }
            });
            this.chatLogs.unshift(chat);
            localStorage.setItem('LLMchatLogs', JSON.stringify(this.chatLogs));
            // scroll to bottom
            setTimeout(() => {
                chatWrapper.scrollTop = chatWrapper.scrollHeight;
            }, 500);
        },
        stopStreaming() {
            this.isStream = false;
            this.isWaiting = false;
            this.streamChunk = [];
            this.ollama.abort();
            // remove that last message and the one before it
            this.messages.contents.splice(this.messages.contents.length - 2, 2);
        },
        showNotify(text,timeout) {
            this.notify.text = text;
            this.notify.show = true;
            if(timeout){
                setTimeout(() => {
                    this.notify.show = false;
                    this.notify.text = '';
                }, timeout);
            } else {
                setTimeout(() => {
                    this.notify.show = false;
                    this.notify.text = '';
                }, 3000);
            }
            
        },
        promptDialogCancel(){
            this.promptDialog = false;
            this.newPrompt = { title: '', prompt: '',credit:'', rate: {like: 0, dislike: 0}, enable: true};
        },
        async getAllPrompts(){
            let _this = this;
            try {
                await fetch(this.mongoCtrlApi + 'getAllPrompts', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json()).then(data =>{
                    _this.promptLib = data;
                })
            } catch (error) {
                console.log(error);
            }
            
        },  
        async createOrUpdatePrompt(){
            // mongoCtrlApi
            let _this = this;
            let _prompt = this.newPrompt;
            try {
                await fetch(this.mongoCtrlApi + 'createOrUpdatePrompt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_prompt)
                }).then(res => res.json()).then(data =>{
                    _this.showNotify(data.message, 5000);
                    _this.promptDialogCancel();
                    _this.getAllPrompts();
                })
            } catch (error) {
                
            }
            
        },
        showPromptDetail(p){
            let _id = p._id.$oid;
            let _thisP = this.promptLib.find(x => x._id.$oid === _id);
            this.newPrompt = _thisP;
            this.promptDialog = true;
        },
        promtpApply(p){
            this.messages.contents.push({
                role: 'system',
                content: p.prompt,
                content_plain: p.prompt.replace(/\n/g, '<br/>'),
                show: true,
                inContext: true,
            });
            setTimeout(() => {
                // focus to chatBox ref
                this.$refs.chatBox.focus();
            }, 500);
        },
        updateSystempPrompt(){
            this.systemPrompt.dialog = false;
            this.messages.contents[0].content = this.systemPrompt.prompt;
        }        
        
        // endofmethods eom
    },
    watch: {
        isStream: function (val) {
            if (!val) {
                setTimeout(() => {
                    chatWrapper.scrollTop = chatWrapper.scrollHeight;
                }, 500);
            }
        },
        functionTab: function (val) {
            if (val) {
                // update url with functionTab param
                window.history.pushState({}, '', `/llm?functionTab=${val}`);
            }
        },
    },
    computed: {
        streamChunkComp() {
            return this.streamChunk.join('');
        },
        temperatureComp(){
            switch (this.selTemperature) {
                case 'creative':
                this.modelOptions.temperature = 0.7;
                break;
                case 'normal':
                this.modelOptions.temperature = 0.5;
                break;
                
                case 'precise':
                this.modelOptions.temperature = 0.1;
                break;
                default:
                this.modelOptions.temperature = 0.5;
                break;
            }
        }
    },
    activated() {
        this.getModelListing();
        this.getAllPrompts();
        chatWrapper = document.getElementById('chatWrapper');
        setInterval(() => {
            if (this.isStream) {
                chatWrapper.scrollTop = chatWrapper.scrollHeight;
            }
        }, 200);
        // check for LLMchatLogs
        if (localStorage.getItem('LLMchatLogs')) {
            this.chatLogs = JSON.parse(localStorage.getItem('LLMchatLogs'));
        }
        // http://10.13.34.154:3001/llm?functionTab=promptingLib
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('functionTab')) {
            this.functionTab = urlParams.get('functionTab');
        }
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
