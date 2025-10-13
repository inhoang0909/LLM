<template>
    <v-app>
        <v-app>
            <v-main>
                <v-container fluid>
                    <v-row>
                        <v-col cols="12" class='my-0'>
                            <v-alert color="red" class="ma-0">
                                {{ $t('trans.warning') }}
                            </v-alert>
                        </v-col>
                        <v-col cols="12" sm="6" class="ma-0 pa-2">
                            <v-card min-height="280" variant="outlined" color="indigo" elevation="20">
                                <v-card-text>
                                    <div class="d-flex justify-space-between align-center">
                                        <div class="d-flex justify-space-between">
                                            <v-checkbox hide-details="" v-for="(cat, index) in dictCatsComp"
                                            :key="index" :label="cat[$i18n.locale]" v-model="selDictCat"
                                            :value="cat.value" class="text-capitalize"></v-checkbox>
                                        </div>
                                        <v-btn :loading="isTranslating" variant="outlined" color="red" @click="postTranslate"
                                        prepend-icon="mdi-translate">
                                        {{ $t('trans.translate') }}
                                    </v-btn>
                                </div>
                                <v-textarea clearable="" :placeholder="$t('trans.sourceTransPlaceholder')"
                                @input="debouncedTranslate" hide-details="" auto-grow variant="outlined"
                                v-model="inputText"></v-textarea>
                                <v-alert v-if="enhanceSource.output" class="my-2">
                                    <div class="d-flex justify-space-between">
                                        <v-chip label size="small" color="red">
                                            {{ $t('trans.enhancedSourceOutput') }}
                                        </v-chip>
                                        <v-btn @click="inputText = enhanceSource.output" variant="outlined" color="green"  size="small" >
                                            {{ $t('trans.useTheEnhancedVersion') }}
                                        </v-btn>
                                    </div>
                                    <small v-html="enhanceSource.output"></small>
                                </v-alert>
                                <div v-if="inputText" class="d-flex justify-space-between">
                                    <small v-if="detectedLangCode">{{ $t('trans.sourceLangDetected') }} {{ this.detectedLangCode }}</small>
                                    <v-btn :loading="enhanceSource.isLoading" variant="outlined" @click="fixingGrammar" color="green" class="my-2">
                                        <v-icon>mdi-auto-fix</v-icon> 
                                        {{ $t('trans.fixingGrammar') }} 
                                    </v-btn>
                                </div>
                                <div v-if="inputText" class="d-flex justify-space-between">
                                    <small v-if="detectedLangCode">{{ $t('trans.sourceLangDetected') }} {{ this.detectedLangCode }}</small>
                                    <v-btn :loading="enhanceSource.isLoading" variant="outlined" @click="enhanceSourceText" color="green" class="my-2">
                                        <v-icon>mdi-auto-fix</v-icon> 
                                        {{ $t('trans.enhanceSourceText') }} 
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="15" sm="6" class="ma-0 pa-2">
                        <v-card variant="outlined" color="primary" elevation="20" min-height="280">
                            <v-card-text>
                                <div class="d-flex justify-space-between justify-center align-center">
                                    <v-btn-toggle divided variant="outlined" v-model="toLang" class="mb-2"
                                    mandatory>
                                    <v-btn @click="translate" v-for="lang in languages" color="primary"
                                    :key="lang.value" :value="lang">
                                    <small><b>{{ lang.text[$i18n.locale] }}</b></small>
                                </v-btn>
                            </v-btn-toggle>
                        </div>
                        <v-textarea class="" style="width: 0; height: 0; opacity: 0;" append-inner-icon="mdi-content-copy" id="output" v-model="internalDictOutputComp.raw" hide-details="" auto-grow variant="outlined"></v-textarea>
                        <div v-if="internalDictOutputComp.raw && !isTransError" class="rounded pa-3" style="border: 1px solid #ddd;"> 
                            <p v-html="internalDictOutputComp.html">
                            </p>
                            <div class="d-flex justify-space-between pt-2">
                                <!-- 2 button as like and dislike with icon only -->
                                <div>
                                    <v-btn @click="rateTranslated('down')" icon size="x-small" variant="outlined" :color="improvedTrans.rateSel === 'down' ? 'orange':'orange-lighten-3'" class="mr-2">
                                        <v-icon>mdi-thumb-down</v-icon>
                                    </v-btn>
                                    <v-btn @click="rateTranslated('up')" icon size="x-small" variant="outlined" :color="improvedTrans.rateSel  === 'up' ? 'green':'green-lighten-3'" class="mr-2">
                                        <v-icon>mdi-thumb-up</v-icon>
                                    </v-btn>
                                </div>
                                <v-btn variant="outlined" size="x-small" icon @click="copyContent" color="primary">
                                    <v-icon left>mdi-content-copy</v-icon>
                                </v-btn>
                            </div>
                        </div>
                        <div class="rounded pa-3" style="border: 1px solid #ddd;" v-else>
                            {{ $t('trans.waitingForUserInput') }}
                        </div>
                        <v-alert v-if="piyinFmtComp" variant="outlined" color="grey" class="mt-2 pa-1">
                            <small>{{ piyinFmtComp }}</small>
                        </v-alert>
                        <v-alert v-if="enhancedTrans" class="my-2">
                            <div class="d-flex justify-space-between">
                                <v-chip label size="small" color="red">
                                    {{ $t('trans.enhancedVersion') }}
                                </v-chip>
                                <v-btn @click="applyEnhancedTrans" variant="outlined" color="green"  size="small" >
                                    {{ $t('trans.useTheEnhancedVersion') }}
                                </v-btn>
                            </div>
                            <span v-html="enhancedTrans"></span>
                        </v-alert>
                        <div v-if="internalDictOutputComp.raw && !isTransError" class="d-flex justify-end">
                            <v-btn variant="outlined" @click="enhanceTheTranslation" color="green" class="my-2">
                                <v-icon>mdi-auto-fix</v-icon> 
                                {{ $t('trans.enhanceTheTranslation') }} 
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <!-- improvedTrans.dialog dialog -->
        <v-dialog v-model="improvedTrans.dialog" max-width="500">
            <v-card>
                <v-card-title>
                    <!-- rating icon -->
                    <v-icon size="small">mdi-thumb-up</v-icon>
                    {{ $t('trans.transFeedbackTitle') }}</v-card-title>
                    <v-card-text>
                        <v-textarea v-model="improvedTrans.msg" variant="outlined" :placeholder="$t('notify.yourFeedbackIsVeryImportant')" auto-grow></v-textarea>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn @click="improvedTrans.dialog = false" color="red">
                            {{ $t('ui.cancel') }}
                        </v-btn>  
                        <v-spacer></v-spacer>
                        <v-btn @click="submitTranslateFeedback" variant="elevated" color="green">
                            {{ $t('ui.submit') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            
            <v-snackbar color="indigo" v-model="snackbar" @click="snackbar = false" location="bottom right">
                {{ msgText }}
            </v-snackbar>
        </v-container>
    </v-main>
</v-app>
</v-app>
</template>
<script>
var debounceTimer;
import specialChars from '@/assets/specialChar.js';
import pinyin from 'pinyin';
export default {
    data() {
        return {
            qdrantApi: 'http://10.13.34.154:6333/collections/',
            specialChars,
            logsApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            llmApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            fromLang: 'Tiếng Việt',
            toLang: {
                text: {
                    en: 'English',
                    vi: 'Tiếng Anh',
                    zh: '英语'
                },
                langCode: 'en',
                value: 'English',
                model: 'llama3:latest'
            },
            inputText: 'Phép năm không phải là không phải là phép bệnh. Mặt giày không phải lúc nào cũng có móc câu !',
            translation: '',
            enhancedTrans: '',
            enhanceSource:{
                output: null,
                isLoading: false,
            },
            snackbar: false,
            msgText: '',
            languages: [
            {
                text: {
                    en: 'Vietnamese',
                    vi: 'Tiếng Việt',
                    zh: '越南语'
                },
                langCode: 'vi',
                value: 'Vietnamese',
                model: 'llama3:latest'
            },
            {
                text: {
                    en: 'English',
                    vi: 'Tiếng Anh',
                    zh: '英语'
                },
                langCode: 'en',
                value: 'English',
                model: 'llama3:latest'
            },
            {
                text: {
                    en: 'Chinese (Simplified)',
                    vi: 'Tiếng Trung (Giản thể)',
                    zh: '简体中文'
                },
                langCode: 'cn',
                value: 'Chinese (Simplified)',
                model: 'llama3:latest'
            },
            {
                text: {
                    en: 'Chinese (Traditional)',
                    vi: 'Tiếng Trung (Phồn thể)',
                    zh: '繁体中文'
                },
                langCode: 'tw',
                value: 'Chinese (Traditional)',
                model: 'llama3:latest'
            },
            ],
            agents: [
            {
                model: 'gemma:latest',
                port: '11434',
                ip: '10.13.34.154',
                role: 'translator',
            },
            {
                model: 'llama3:latest',
                port: '11435',
                ip: '10.13.34.154',
                role: 'translator',
            },
            {
                model: 'llama3:latest',
                port: '11436',
                ip: '10.13.34.154',
                role: 'rating',
            },
            ],
            agentResponse: [],
            agentLoading: false,
            isAgentFinnished: false,
            internalDict: false,
            dictData: [],
            highLightDictData: [],
            debouncedTranslate: null,
            debounceTime: 2500,
            selDictCat: ['general'],
            isTransError: false,
            improvedTrans: {
                rateSel: null, // up or down
                translatedId: '', // for update the translation rate
                dialog: false,
                msg: '',
            },
            isTranslating: false,
            detectedLangCode: null,
        };
    },
    methods: {
        async postTranslate(){
            if (this.selDictCat.length > 0) {
                // await this.doEmbedingTask();
                // this.llmWordSpliting();
                this.dictionaryMatching();
                return;
            } else {
                this.translate();
            }
        },
        async translate() {
            let _this = this;
            this.isTranslating = true;
            this.isTransError = false;
            this.enhancedTrans = '';
            clearTimeout(debounceTimer);
            if (this.inputText === '') {
                this.showSnackbar(this.$t('notify.emptyInput'));
                return;
            }
            this.translation = 'Translating...';
            await fetch(this.ollamaApiComputed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.toLang.model,
                    // prompt: `Translate this text and DO NOT add any more text: ${this.inputText} \n \n  to ${this.toLang} \n \n `,
                    system: this.systemPromptComp,
                    prompt: this.transPromptComp,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0,
                        seed: 123,
                        num_ctx: 4096,
                    }
                })
            }).then(response => response.json())
            .then(data => {
                this.isTranslating = false;
                this.detectedLangCode = null;
                try {
                    let _response = JSON.parse(data.response);
                    if (_response.output) {
                        _this.translation = _response.output;
                        _this.savingTranslationLogs('Success', 'Translated successfully');
                        _this.detectedLangCode = _response.source_lang_code;
                    }
                } catch (error) {
                    console.log('JSON parse error:', error);
                    _this.translation = 'Error: ' + data;
                    this.showSnackbar(this.$t('notify.errorAndWaitForRevise'));
                    _this.savingTranslationLogs('Error', data);
                    console.log('trigger from inside');
                    this.jsonReviseAgent(data.response);
                    this.isTransError = true;
                }
            }).catch((error) => {
                _this.translation = 'Error: ' + error;
                _this.savingTranslationLogs('Error', error);
                this.isTransError = true;
                this.isTranslating = false;
            });
        },
        async savingTranslationLogs(status, msg) {
            // do post request to logsApi with inputText and translation / server
            await fetch(this.logsApi + 'savingTranslationLogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputText: this.inputText,
                    translation: this.translation,
                    rate: null,
                    feedBack: null,
                    status,
                    msg
                })
            }).then(response => response.json()).then(data => {
                this.improvedTrans.translatedId = data._id;
                
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        async submitTranslateFeedback(){
            // do post request to logsApi with inputText and translation / server
            await fetch(this.logsApi + 'submitTranslateFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    _id: this.improvedTrans.translatedId,
                    rate: this.improvedTrans.rateSel,
                    feedBack: this.improvedTrans.msg,
                })
            }).then(response => response.json()).then(data => {
                // get the id of the translated text
                // log to the console
                console.log('Log response:', data);
                this.showSnackbar(this.$t('notify.thankYouForRating'));
                this.improvedTrans.dialog = false;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        copyContent() {
            let copyText = document.getElementById("output");
            copyText.select();
            copyText.setSelectionRange(0, 99999); /*For mobile devices*/
            document.execCommand("copy");
            this.showSnackbar(this.$t('notify.copied'));
        },
        showSnackbar(msg) {
            this.msgText = msg;
            this.snackbar = true;
            setTimeout(() => {
                this.snackbar = false;
                this.msgText = msg;
            }, 3000);
        },
        debounce(func, delay) {
            return function () {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
            };
        },
        async getAllWords() {
            console.log('getAllWords');
            // get all words from dictionary
            // do get request to llmApi to get all words
            await fetch(this.llmApi + 'getAllWords')
            .then(response => response.json())
            .then(data => {
                this.highLightDictData = data;
                console.log('highLightDictData:', this.highLightDictData);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        },
        async enhanceTheTranslation() {
            // do post request to ollama Api to get the revised translation
            await fetch('http://10.13.34.154:11435/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'aya:latest',
                    system: `${this.dictDataFmt}
                    YOU ARE A LANGUAGE EXPERT WITH 20 YEAR OF EXPERIENCE. DO NOT ENGAGE IN CONVERSATION. REMAIN ALL THE INTERNAL DICTIONARY WORDS ON YOUR OUTPUT. ALWAYS RETURN YOUR RESULT IN JSON FORMAT.`,
                    prompt: `Revise below translation to get the better version of this translation. REMAIN ALL THE INTERNAL DICTIONARY WORDS ON YOUR OUTPUT. Only return the revised translation in JSON format:
                    __
                    Source text for reference: ${this.fmtText}
                    Target language: ${this.toLang.value}
                    Last translation: ${this.internalDictOutputComp.raw}
                    __
                    JSON:{"output":"your enhanced version of the translation"}
                    `,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0.5,
                        num_ctx: 4096,
                    }
                })
            }).then(response => response.json()).then(data => {
                let _r = JSON.parse(data.response);
                console.log('Revised trans:', _r);
                this.enhancedTrans = _r.output;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        async jsonReviseAgent(rawJson) {
            // do post request to ollama Api to get the revised translation
            await fetch('http://10.13.34.154:11436/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama3-chatqa:latest',
                    system: 'JUST REVISE THE JSON FORMAT. DO NOT ENGAGE IN CONVERSATION.',
                    prompt: `Revise below JSON to the correct format:
                    __
                    ${rawJson}
                    __
                    return the revised JSON format as:
                    {"ouput": "your revised JSON value"}
                    `,
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0,
                        num_ctx: 4096,
                    }
                })
            }).then(response => response.json()).then(data => {
                let _r = JSON.parse(data.response);
                console.log('Revised JSON:', _r);
                this.translation = _r.output;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        rateTranslated(rate) {
            this.improvedTrans.rateSel = rate === 'up' ? 'up' : 'down';
            if(rate === 'down'){
                this.showSnackbar(this.$t('notify.yourFeedbackIsVeryImportant'));
                this.improvedTrans.dialog = true;
            } else{
                this.submitTranslateFeedback();
            }
        },
        applyEnhancedTrans() {
            this.translation = this.enhancedTrans;
            this.enhancedTrans = '';
        },
        async enhanceSourceText(){
            // do post request to ollama Api to get the enhance the meaning of the source text
            this.enhanceSource.isLoading = true;
            await fetch('http://10.13.34.154:11435/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'aya:latest',
                    system: `${this.dictDataFmt}
                    YOU ARE A LANGUAGE TEACHER WITH 20 YEAR OF EXPERIENCE. DO NOT ENGAGE IN CONVERSATION. ALWAYS RETURN YOUR RESULT IN JSON FORMAT.`,
                    prompt: `Enhance the words, the phrase of the text below to be more clear, also fix the grammar if there're. Only return the revised version in JSON format:
                    __
                    Source text for reference: ${this.fmtText}
                    __
                    JSON:{"output":"your enhanced version of the text"}
                    `,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0.5,
                        num_ctx: 4096,
                    }
                })
            }).then(response => response.json()).then(data => {
                let _r = JSON.parse(data.response);
                this.enhanceSource.output = _r.output;
                this.enhanceSource.isLoading = false;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        async fixingGrammar(){
            // do post request to ollama Api to get the grammar revise of the source text
            this.enhanceSource.isLoading = true;
            await fetch('http://10.13.34.154:11435/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'aya:latest',
                    system: `${this.dictDataFmt}
                    YOU ARE A LANGUAGE EXPERT WITH 20 YEAR OF EXPERIENCE. DO NOT ENGAGE IN CONVERSATION. ALWAYS RETURN YOUR RESULT IN JSON FORMAT.`,
                    prompt: `Fixing typos and grammar on the source text below. Only return the revised version in JSON format:
                    __
                    Source text for reference: ${this.fmtText}
                    __
                    JSON:{"output":"your enhanced version of the text"}
                    `,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0.5,
                        num_ctx: 4096,
                    }
                })
            }).then(response => response.json()).then(data => {
                let _r = JSON.parse(data.response);
                this.enhanceSource.output = _r.output;
                this.enhanceSource.isLoading = false;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        async llmWordSpliting(){
            let _sysPrompt = `Process the user's input and separate it into meaningful words. User's input could be in Vietnamese, Chinese, English. Always return JSON format as follows : {"output":["your spliting result as an array, all in lowercase, and no special characters"] }`;
            await fetch('http://10.13.34.154:11435/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama3:instruct',
                    system: _sysPrompt,
                    prompt: `Return your processed results in JSON format and DO NOT engage in conversation.
                    User input:
                    ___START OF USER INPUT___
                    ${this.fmtText}
                    ___END OF USER INPUT___`,
                    stream: false,
                    format: 'json',
                    keep_alive: -1,
                    options: {
                        temperature: 0.1,
                        seed: 123
                        // num_ctx: 4096,
                    }
                })
            }).then(response => response.json()).then(data => {
                let _r = JSON.parse(data.response);
                console.log('Splitting JSON:', _r);
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        dictionaryMatching(){
            // loop through the input text and match with the dictionary words try with vietnamese first
            // if not found then try with chinese
            // if not found then try with english
            // if not found then return the original text
            // then put the matched words into the context of LLM
            let _input = this.fmtText;
            let _dict = this.dictCompByCat;
            let _matched = [];
            _dict.forEach((word) => {
                // in-sensitive case
                let _reg = new RegExp(word.vi, 'gi');
                if (_input.match(_reg)) {
                    _matched.push(word);
                }
            });
            console.log('Matched:', _matched);
        },
        async doEmbedingTask(){
            let embeddingMdl = 'nextfire/paraphrase-multilingual-minilm:latest';
            // generate the embeding for all words in dictionary
            let embeddingApi = 'http://10.13.34.154:11435/api/embeddings';
            await fetch(embeddingApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: embeddingMdl,
                    prompt: this.fmtText,
                    keep_alive: -1,
                })
            }).then(response => response.json())
            .then(data => {
                this.qdrantFindSimiliar(data.embedding);
            }).catch((error) => {
                console.error('doEmbedingTask Error:', error);
            });
        },
        async qdrantFindSimiliar(vector) {
            // POST collections/general/points/search
            // {
            //     "vector": [0.2, 0.1, 0.9, 0.7],
            //     "limit": 3,
            //     "with_payload": true
            // }
            fetch (this.qdrantApi + 'general/points/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vector,
                    limit: 20,
                    with_payload: true
                })
            }).then(response => response.json()).then(data => {
                // console.log(data.result.map(x => x.payload.word));
                let _words = data.result.map(x => x.payload.word.text);
                this.dictData = _words;
                console.log(data);
                console.log(dictData);
                // console.log('dictData length:', this.dictData.length, 'length: ',this.inputText.split(' ').length);
                this.translate();
            }).catch((error) => {
                console.error('Qdrant Error:', error);
            });
            
        },
        // end of methods || eom
    },
    computed: {
        fmtText() {
            let _input = this.inputText;
            _input = _input.replace(/\n/g, '\\n');
            if (this.toLang.langCode !== 'zh') {
                return _input;
            }
            // replace newline break with safe for JSON
            // replace special characters with safe for JSON
            this.specialChars.forEach((char) => {
                for (let key in char) {
                    let _reg = new RegExp(key, 'g');
                    _input = _input.replace(_reg, char[key]);
                }
            });
            return _input;
        },
        systemPromptComp() {
            return `
            ${this.dictDataFmt}
            YOU ARE A TRANSLATION MACHINE, DO THE TRANSLATE, AND DO NOT ANSWERING USER QUESTION. DO NOT ENGAGE IN CONVERSATION. DO NOT ADD ANY EXTRA TEXT OTHER THAN THE TRANSLATION. DO NOT MENTION ANYTHING ABOUT THE INTERNAL DICTIONARY. ALWAYS RETURN YOUR RESULT IN JSON FORMAT.`;
            // switch(this.toLang.value){
            //     case 'English':
            //     return `you are a translation machine. DO NOT ENGAGE IN CONVERSATION.`;
            //     case 'Vietnamese':
            //     return `bạn là một máy dịch. ĐỪNG THAM GIA TRONG CUỘC TRÒ CHUYỆN. KHÔNG ĐƯỢC THÊM BẤT KỲ VĂN BẢN NÀO KHÁC NGOÀI BẢN DỊCH.`;
            //     case 'Chinese (Simplified)':
            //     return `你是一个翻译机器。不要参与对话。`;
            //     case 'Chinese (Traditional)':
            //     return `你是一台翻譯機。不要參與對話。`;
            // }
        },
        piyinFmtComp() {
            if (this.internalDictOutputComp.raw && ['cn','tw'].includes(this.toLang.langCode)) {
                let _cleaned = this.internalDictOutputComp.raw.replace(/<b>/g, '').replace(/<\/b>/g, '');
                    let _fmt = pinyin(_cleaned, {
                        segment: true,
                        group: true
                    });
                    return _fmt.join(' ');
                }
            },
            ollamaApiComputed() {
                return `http://10.13.34.154:11434/api/generate`;
            },
            dictDataFmt() {
                if (this.selDictCat.length === 0) {
                    return '';
                }
                var _dictCtx = `Based on the internal dictionary context, the following words are provided in an order of:  English || Vietnamese || Simplified Chinese || Traditional Chinese. Please use these words as a reference for your translation task:\n`;
                if (this.dictData.length > 0) {
                    let _fmt = _dictCtx;
                    _fmt += this.fmtDictComp;
                    return _fmt + `\n End of internal dictionary content.`;
                }
            },
            dictCatsComp() {
                // base on this.dictData to generate the categories of the dictionary data
                //  and the cats is an array of unique categories
                // alway let the 'general in the first place'
                return [
                {
                    en: 'general',
                    vi: 'Phổ biến',
                    zh: '一般',
                    value: 'general'
                },
                {
                    en: 'production',
                    vi: 'sản xuất',
                    zh: '生产',
                    value: 'production'
                },
                {
                    en: 'PCC',
                    vi: 'PCC',
                    zh: 'PCC',
                    value: 'pcc'
                }
                ];
            },
            fmtDictComp() {
                // format the dictionary data to fit with the translation task
                let _fmt = '';
                if (this.dictData.length > 0) {
                    this.dictData.forEach((text) => {
                        _fmt += `${text}`;
                    });
                }
                return _fmt;
            },
            transPromptComp() {
                switch (this.toLang.value) {
                    case 'English':
                    return `DO NOT SHOW THE INTERNAL DICTIONARY CONTENT.
                    Translate the text below to English. DO NOT ADD EXTRA TEXT or mention anything about internal dictionary, just only return result in JSON as: 
                    Example JSON:{"output":"your translated text", "source_lang_code": "base on international code"}
                    ____
                    ${this.fmtText}
                    ____`;
                    case 'Vietnamese':
                    return `
                    LƯU Ý: KHÔNG THÊM VĂN BẢN NÀO KHÁC hoặc đề cập đến bất kỳ điều gì về từ điển nội bộ, chỉ trả kết quả duy nhất dưới dạng JSON như sau: 
                    Ví dụ JSON:{"output":"Nội dung văn bản đã dịch của bạn", "source_lang_code": "dựa vào bảng mã ngôn ngữ quốc tế"}.
                    Dịch văn bản dưới đây sang tiếng Việt: 
                    __
                    
                    ${this.fmtText}`;
                    case 'Chinese (Simplified)':
                    return `不要显示内部字典内容。
                    将下面的文本翻译成简体中文。不要添加额外的文本或提及任何关于内部字典的内容，只需以*JSON*格式返回结果： 
                    JSON格式:{"output":"您的翻译文本", "source_lang_code":"根据国际代码"}
                    ____
                    ${this.fmtText}
                    ____`;
                    case 'Chinese (Traditional)':
                    return `不要顯示內部字典內容。
                    將下面的文本翻譯成繁体中文。不要添加額外的文本或提及任何關於內部字典的內容，只需以*JSON*格式返回結果： 
                    JSON格式:{"output":"您的翻譯文本", "source_lang_code": "基於國際代碼"}
                    ____
                    ${this.fmtText}
                    ____`;
                }
            },
            internalDictOutputComp() {
                if(!this.translation || this.translation === 'Translating...'){
                    return false;
                }
                let _output = this.translation;
                let _htmlOutput = this.translation;
                if (this.dictData.length > 0) {
                    this.dictData.forEach((word) => {
                        if (this.selDictCat.length > 0 && word.cats) {
                            word.cats.forEach((cat) => {
                                if (this.selDictCat.includes(cat)) {
                                    let _reg;
                                    let langWord = word[this.toLang.langCode];
                                    if (langWord) {
                                        _reg = new RegExp(langWord, 'gi');
                                        _htmlOutput = _htmlOutput.replace(_reg, function (match) {
                                            // return match === langWord ? `<b>${match}</b>` : match;
                                            return `<b>${match}</b>`;
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                // replace all newline break with <br> tag
                _htmlOutput = _htmlOutput.replace(/\n/g, '<br>');
                return {
                    html: _htmlOutput,
                    raw: _output
                };
            },
            dictCompByCat(){
                if(this.selDictCat.length > 0){
                    return this.highLightDictData.filter(x => x.cats && x.cats.some(r => this.selDictCat.includes(r)));
                } else {
                    return [];
                }
            }
            // end of computed || eoc
        },
        watch: {
            
        },
        created() {
            this.debouncedTranslate = this.debounce(this.postTranslate, this.debounceTime || 2000);
        },
        activated() {
            this.getAllWords();
        },
    };
</script>
<style>
#output b {
    text-decoration: underline;
    color: orange;
}
</style>
