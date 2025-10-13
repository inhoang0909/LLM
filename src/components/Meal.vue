<template>
    <v-app>
        <v-main>
            <v-container>
                <v-row>
                    <v-col cols="12">
                        <v-card height="650">
                            <v-toolbar color="cyan" >
                                <v-toolbar-title>{{ `Function Calling (Meal) | ${model}` }}</v-toolbar-title>
                                <v-row class="pt-6">
                                    <v-col cols="7">
                                        <v-select
                                        variant="underlined"
                                        :items="modelListing"
                                        v-model="model"
                                        label="Model"
                                        class="text-uppercase pt-2"
                                        @change="chatReset"
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="5">
                                        <v-radio-group class="pt-5 d-inline" v-model="renderMode" inline>
                                            <v-radio value="md" label="Markdown"></v-radio>
                                            <v-radio value="plain" label="Plain Text"></v-radio>
                                        </v-radio-group>
                                    </v-col>
                                </v-row>
                            </v-toolbar>
                            <v-card-text>
                                <v-list three-line style="overflow-y: auto; height: 550px;" id="chatWrapper" ref="chatWrapper" class="pb-8">
                                    <template v-for="(message, mIndex) in messages" :key="mIndex">
                                        <v-list-item density="" v-if="message.show">
                                            <v-list-item-title class="text-uppercase">
                                                <img style="width: 100px;position: absolute;top: -15px;left: 67px;" v-show="isWaiting && message.role === 'assistant' && mIndex === messages.length - 1" ref="loadingGif" :src="typingGif"/>
                                                <v-btn size="x-small" :color="message.role === 'user'?'primary':'red'" variant="outlined">{{ message.role }}</v-btn>
                                            </v-list-item-title>
                                            <v-card>
                                                <v-card-text v-if="message.role === 'assistant'" :class="message.role === 'assistant' && mIndex === messages.length - 1 ? 'stream' : ''" v-html="renderMode == 'md'?message.content_md : message.content">
                                                </v-card-text>
                                                <v-card-text v-else="message.role === 'user'" v-html="message.content_plain">
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
                    <v-col cols="1">
                        <v-btn disabled="" color="primary" class="mb-1" @click="triggerFileInputDialog" icon="mdi-paperclip"></v-btn>
                        <v-btn color="red" @click="chatReset" icon="mdi-delete-circle-outline"></v-btn>
                        <input ref="fileInput" class="d-none" type="file" @change="handleFileUpload">
                    </v-col>
                    <v-col cols="11">
                        <v-textarea rows="3" label="Type your message" @keydown="keyPressHandler" v-model="newMessage" append-icon="mdi-send" @click:append="msgClassifier"></v-textarea >
                        </v-col>
                    </v-row>
                </v-container>
            </v-main>
        </v-app>
    </template>
    <script>
    import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
    import { HumanMessage } from "@langchain/core/messages";
    import { Ollama } from "@langchain/community/llms/ollama";
    import { ChatOllama } from "@langchain/community/chat_models/ollama";
    import { ChatPromptTemplate } from "@langchain/core/prompts";
    import typingGif from '@/assets/typing.gif'
    import MarkdownIt from 'markdown-it'; 
    var chatWrapper;
    export default {
        data() {
            return {
                ollama: null,
                fnOllama: null,
                typingGif,
                newMessage: '2024-01-24, 11522 what meal did i got ?',
                stream: '',
                messages: [{"role":"system","content":"YOU'RE VIETNAMESE CHATBOT, ONLY RESPONSE IN VIETNAMESE","show":false}],
                selectedItem: null,
                isStream: false,
                model: 'openchat:latest',
                modelListing: [],
                renderMode: 'md', // md or plaintext
                isWaiting: true,
                tools: [ {
                    name: "get_current_weather",
                    description: "Get the current weather in a given location",
                    parameters: {
                        type: "object",
                        properties: {
                            location: {
                                type: "string",
                                description: "The city and state, e.g. San Francisco, CA",
                            },
                            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                        },
                        required: ["location"],
                    },
                },
                {
                    name: "get_meal_by_date",
                    description: "Retrieve the employee's ID and the date associated with their meal (món ăn) orders. If the user does not specify a date predict the time based on the user's input. User input could input in English, Mandarin Chinese, and Vietnamese. Try to detect related keywords in the user's input.",
                    parameters: {
                        type: "object",
                        properties: {
                            employee_id: {
                                type: "string",
                                description: "The employee id. minimum length is 5. Example: 00001",
                            },
                            date: { type: "string",
                            description: `Retrieve the date in the format YYYY-MM-DD (e.g., 2021-09-01). If the user does not provide a specific date, use the following reference object to interpret common date-related terms in English, Mandarin Chinese, and Vietnamese:
                            {
                                "today": ["today", "今天", "hôm nay"],
                                "tomorrow": ["tomorrow", "明天", "ngày mai"],
                                "yesterday": ["yesterday", "昨天", "hôm qua"]
                            }. 
                            For example, if the user input is "昨天", it should be interpreted as 'yesterday'. If the input is "ngày mai", interpret it as 'tomorrow'. Then, return the corresponding English lowercase key from this object.
                            
                            Ensure that if the input matches any of these terms, you return the current, next, or previous date accordingly. If the input is a specific date, return it as is.
                            
                            Examples:
                            User input: "2021-09-01" → Return: "2021-09-01"
                            User input: "今天" → Return: "today"
                            User input: "ngày mai" → Return: "tomorrow"
                            `
                        },
                        required: ["employee_id","date"],
                    }
                }
            }
            ],
        };
    },
    methods: {
        async getModelListing() {
            try {
                const response = await fetch('http://10.13.34.154:11434/api/tags');
                const data = await response.json();
                const mdlListing = data.models.map(mdl => mdl.name);
                this.modelListing = mdlListing;
            } catch (error) {
                console.error(error);
                return [];
            }
        },
        async msgClassifier(){
            console.log('msgClassifier: ',this.newMessage);
            let model = new ChatOllama({
                baseUrl: "http://10.13.34.154:11434",
                model: 'openchat:7b-v3.5-1210-q5_K_M',
                format: "json",
                options: {
                    repeat_penalty: 1.5,
                }
            });
            const prompt = ChatPromptTemplate.fromMessages([
            [
            "system",
            `You are a natural language classifier system, fluently processing Vietnamese, Chinese, English then base on user input and content of your tools function as describe on {llm_tools} you have to decide that user want to CHAT with you or ASKING to trigger the specific functions.
            DO NO ENGAGE CONVERSATION WITH USER, DO NOT ADDING ANYTHING ELSE TO YOUR JSON RESPONSE. ONLY DO YOUR EXACT JOB.
            Then response in valid JSON format example:
            "target":"chat", "function_name": null.
            Or incase user want to call a function then response as :
            "target":"function",
            "function_name": //the function name that could solve the request.`, 
            ],
            ["human", `{input}`],
            ]);
            const chain = prompt.pipe(model);
            const result = await chain.invoke({
                input: this.newMessage,
                llm_tools: JSON.stringify(this.tools),
            });
            let output = JSON.parse(result.content);
            if(output){
                console.log('output: ',output);
                // checking function_name was in the this.tools or not
                let _fn = this.tools.find(fn => fn.name == output.function_name);
                if(_fn){
                    // we got this fnc in our tools
                    this.extractParamsUsingTools(this.newMessage);
                } else {
                    // return to chat mode
                    this.sendMessage();
                }
            }
        },
        async extractParamsUsingTools(userInput){
            let _this = this;
            this.fnOllama = new OllamaFunctions({
                baseUrl: "http://10.13.34.154:11434",
                temperature: 0.1,
                model: "openchat:7b-v3.5-1210-q5_K_M",
            }).bind({
                functions: this.tools,
                // // You can set the `function_call` arg to force the model to use a function
                // function_call: {
                    //     name: "",
                    // },
                });
                const response = await this.fnOllama.invoke([ new HumanMessage({ content: userInput, }), ]).then(res =>{
                    let _res = {
                        fn_name: res.additional_kwargs.function_call.name,
                        params: JSON.parse(res.additional_kwargs.function_call.arguments),
                    }
                    if(_res.fn_name == 'get_meal_by_date'){
                        _this.getMeal(_res.params).then(res => {
                            this.messages.push({
                                role: 'user',
                                content: this.newMessage,
                                content_plain : this.newMessage.replace(/\n/g, '<br/>'),
                                show: true,
                            });
                            this.messages.push({
                                role: 'system',
                                content: `Your new context: the meal request for ${_res.params.employee_id} is  ${Object.values(res)[1]} meal(s) on ${_res.params.date}, answer to the user on your next response.`,
                                content_plain : `Your new context: the meal request for ${_res.params.employee_id} is  ${Object.values(res)[1]} meal(s) on ${_res.params.date}, answer to the user on your next response.`,
                                show: false,
                            });
                            this.messages.push({
                                role: 'assistant',
                                content: '',
                                show: true,
                            });
                            console.log('messsages: ',this.messages);
                            this.chat();
                        });
                    };
                });
            },
            async getMeal(params){
                try {
                    const response = await fetch(`http://gmo021.cansportsvg.com/api/vg-menu/llm_get_meal/${params.employee_id}/${params.date}`);
                    const data = await response.json();
                    return data;
                } catch (error) {
                    console.error(error);
                }
            },
            async setModel(model){
                this.ollama = new Ollama({
                    baseUrl: "http://10.13.34.154:11434",
                    model: model,
                    temperature: 0.1,
                });
                const stream = await this.ollama.stream(
                `Translate "I love programming" into German.`
                );
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                console.log(chunks.join(""));
            },
            streamToChat(text){
                document.querySelector('.stream').innerHTML += text
            },
            async sendMessage() {
                if (this.newMessage.trim() !== '') {
                    this.messages.push({
                        role: 'user',
                        content: this.newMessage,
                        content_plain : this.newMessage.replace(/\n/g, '<br/>'),
                        show: true,
                    });
                    this.newMessage = '';
                    this.messages.push({
                        role: 'assistant',
                        content: '',
                        show: true,
                    });
                    await this.chat();
                }
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
                    const response = await fetch('http://10.13.34.154:11434/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: this.model,
                            messages: this.messages,
                            options: {
                                temperature: 0.1,
                            }
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
                            // console.log('Stream finished');
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
                        event.preventDefault();
                        // this.sendMessage();
                        this.msgClassifier();
                    }
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
        activated() {
            this.getModelListing();
            // this.initFnModel();
            // this.setModel(this.model);
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
    white-space: pre-wrap; /* Since CSS 2.1 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.5;
}
</style>