<template>
    <v-app>
        <v-app>
            <v-main>
                <v-container fluid>
                    <v-row>
                        <v-col class="grey" cols="4">
                            <div class="d-flex justify-space-between align-center mb-1">
                                <v-text-field :label="$t('dict.searchPlaceholder')" color='blue' variant="outlined" hide-details="" density="compact" v-model="query" append-inner-icon="mdi-magnify"></v-text-field>
                                <v-btn class="ml-3" variant="elevated" color="blue" @click="newWord">
                                    {{ $t('dict.newWord') }}
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </div>
                            <v-chip-group>
                                <!-- render catsOptions -->
                                <v-chip color="blue" @click="filterByCat='all'" variant="flat" class="mr-2 text-capitalize">
                                    {{ $t('dict.catsAll') }}
                                </v-chip>
                                <v-chip v-for="(cat, index) in catsOptions" :key="index" @click="filterByCat = cat.value" class="mr-2 text-capitalize" variant="flat" color="blue" outlined>{{ cat.title[uiLang] }}</v-chip>
                            </v-chip-group>
                            <v-list style="height: 75vh; border: 1px solid #ccc; border-radius: 10px;" class="pa-3">
                                <template v-for="(word, index) in fuzzyRender" :key="index">
                                    <v-list-item class="py-2">
                                        <v-list-item-content>
                                            <v-list-item-title @click="selWord = word" class="d-flex justify-space-between">
                                                <b class="text-blue text-capitalize">{{ word.title }}</b>
                                                <div>
                                                    <v-chip size="x-small" variant="outlined" color="primary" v-for="(cat, index) in word.cats" :key="index" class="mr-1 text-capitalize">
                                                        <!-- output cat title by i18n -->
                                                        {{ catsOptions.find((c) => c.value === cat).title[uiLang]}}
                                                    </v-chip>
                                                </div>
                                            </v-list-item-title>
                                            <v-list-item-subtitle>
                                                <small class="text-red text-capitalize">{{ word.subtitle }}</small> 
                                            </v-list-item-subtitle>
                                        </v-list-item-content>
                                        <template v-slot:prepend>
                                            <v-btn
                                            icon="mdi-pencil-outline"
                                            variant="elevated"
                                            size="x-small"
                                            @click="editWord(word)"
                                            class="mr-2"
                                            ></v-btn>
                                        </template>
                                    </v-list-item>
                                    <v-divider></v-divider>
                                </template>
                            </v-list>
                        </v-col>
                        <v-col cols="8">
                            <v-alert variant="outlined" color="blue blue-lighten-1" v-show="!selWord">
                                <v-icon>
                                    mdi-information
                                </v-icon>
                                <b v-show="uiLang === 'en'">
                                    Please select a word to view detail.
                                </b>
                                <b v-show="uiLang === 'vi'">
                                    Vui lòng chọn một từ để xem chi tiết.
                                </b>
                                <b v-show="uiLang === 'zh'">
                                    请选择一个词查看详细信息。
                                </b>
                            </v-alert>
                            <div v-if="selWord">
                                <v-row>
                                    <v-col cols="12">
                                        <v-card variant="outlined" color="blue blue-lighten-1">
                                            <v-card-title>
                                                <b class="text-capitalize text-red-lighten-1">{{ selWord.title }}</b>
                                            </v-card-title>
                                            <v-card-text>
                                                <b class="text-capitalize text-red">{{ selWord.subtitle }}</b>
                                            </v-card-text>
                                            <v-divider></v-divider>
                                            <v-card-text class="text-red-lighten-1">
                                                {{ selWord.descUi }}
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-card variant="outlined" color="blue blue-lighten-1">
                                            <v-card-text>
                                                <v-row>
                                                    <v-col cols="3">
                                                        <v-text-field density="comfortable" hide-details="" variant="outlined" ref="w-en" id="w-en" outlined v-model="selWord.en" label="English" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copyToClipboard('w-en',selWord.en)"></v-text-field>
                                                    </v-col>
                                                    <v-col cols="3">
                                                        <v-text-field density="comfortable" hide-details="" variant="outlined" ref="w-vi" id="w-vi" outlined v-model="selWord.vi" label="Tiếng Việt" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copyToClipboard('w-vi',selWord.vi)"></v-text-field>
                                                    </v-col>
                                                    <v-col cols="3">
                                                        <v-text-field density="comfortable" hide-details="" variant="outlined" ref="w-cn" id="w-cn" outlined v-model="selWord.cn" label="简体中文" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copyToClipboard('w-cn',selWord.cn)"></v-text-field>
                                                        <small v-if="selWord.cn.length">
                                                            {{ renderPinyin(selWord.cn) }}
                                                        </small>
                                                    </v-col>
                                                    <v-col cols="3">
                                                        <v-text-field density="comfortable" hide-details="" variant="outlined" ref="w-tw" id="w-tw" dense outlined v-model="selWord.tw" label="繁体中文" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copyToClipboard('w-tw',selWord.tw)"></v-text-field>
                                                        <small v-if="selWord.tw.length">
                                                            {{ renderPinyin(selWord.tw) }}
                                                        </small>
                                                    </v-col>
                                                </v-row>
                                                <v-divider></v-divider>
                                                <v-row>
                                                    <v-col v-if="uiLang != 'en'" cols="12">
                                                        <v-textarea variant="outlined" auto-grow="" hide-details="" rows="2" dense outlined v-model="selWord.desc.en" :label="$t('dict.descEn')" readonly></v-textarea>
                                                    </v-col>
                                                    <v-col cols="12" v-if="uiLang != 'cn'">
                                                        <v-textarea variant="outlined" auto-grow="" hide-details="" rows="2" class="my-2" dense outlined v-model="selWord.desc.cn" :label="$t('dict.descCn')" readonly></v-textarea>
                                                    </v-col>
                                                    <v-col cols="12" v-if="uiLang != 'cn'">
                                                        <v-textarea variant="outlined" auto-grow="" hide-details="" rows="2" class="my-2" dense outlined v-model="selWord.desc.tw" :label="$t('dict.descTw')" readonly></v-textarea>
                                                    </v-col>
                                                    <v-col cols="12" v-if="uiLang != 'vi'">
                                                        <v-textarea variant="outlined" auto-grow="" hide-details="" rows="2" class="my-2" dense outlined v-model="selWord.desc.vi" :label="$t('dict.descVi')" readonly></v-textarea>
                                                    </v-col>
                                                </v-row>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-col>
                    </v-row>
                    <v-dialog v-model="wordDialog">
                        <v-card>
                            <v-card-title class="d-flex justify-space-between align-center">
                                <b>
                                    <!-- edit icon -->
                                    <v-icon>mdi-plus</v-icon>
                                    {{ editMode === 'new' ? $t('dict.newWord') : $t('dict.updateWord') }}
                                </b>
                                <!-- checkboxes for cats selecting using i18n -->
                                <div class="d-flex justify-space-between align-center px-4 rounded py-0" style="border: 1px solid #ccc">
                                    {{ $t('dict.cats') }}:
                                    <div class="d-flex justify-space-between">
                                        <v-checkbox hide-details="" v-model='newWordTemplate.cats' color="orange" v-for="(cat, index) in catsOptions" :key="index" :label="cat.title[uiLang]" :value="cat.value"></v-checkbox>
                                    </div>
                                </div>
                            </v-card-title>
                            <v-divider></v-divider>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="12" class="text-right">
                                        <v-btn :disabled="!(newWordTemplate.en.length || newWordTemplate.vi.length || newWordTemplate.cn.length || newWordTemplate.tw.length)" @click="autoTransBlankWords()" variant="outlined" class="mt-1" color="primary">
                                            <v-icon>mdi-translate</v-icon>
                                            <!-- Auto Translate -->
                                            {{ $t('dict.autoTranslate') }}
                                        </v-btn>
                                    </v-col>
                                    <v-col cols="3">
                                        <v-text-field density="compact" clearable hide-details="" variant="outlined" v-model="newWordTemplate.en" :label="$t('dict.en')" dense></v-text-field>
                                    </v-col>
                                    <v-col cols="3">
                                        <v-text-field density="compact" clearable hide-details="" variant="outlined" v-model="newWordTemplate.vi" :label="$t('dict.vi')" dense></v-text-field>
                                    </v-col>
                                    <v-col cols="3">
                                        <v-text-field density="compact" clearable hide-details="" variant="outlined" v-model="newWordTemplate.cn" :label="$t('dict.cn')" dense></v-text-field>
                                    </v-col>
                                    <v-col cols="3">
                                        <v-text-field density="compact" clearable hide-details="" variant="outlined" v-model="newWordTemplate.tw" :label="$t('dict.tw')" dense></v-text-field>
                                    </v-col>
                                    
                                    <v-divider></v-divider>
                                    <v-col cols="3">
                                        <div v-if="newWordTemplate.desc.en" class="d-flex justify-end my-3">
                                            <v-btn variant="text" @click="copyDescTo(newWordTemplate.desc.en,'vi')" color="green">
                                                <v-icon>mdi-content-copy</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-transfer-right</v-icon>
                                            </v-btn>
                                        </div>
                                        <v-textarea auto-grow persistent-hint="" no-resize counter variant="outlined" v-model="newWordTemplate.desc.en" :label="$t('dict.descEn')" dense append-inner-icon="mdi-auto-fix" @click:append-inner="autoGenDesc('en')"></v-textarea>
                                    </v-col>
                                    <v-col cols="3">
                                        <div v-if="newWordTemplate.desc.vi" class="d-flex justify-space-between my-3">
                                            <v-btn variant="text"  @click="copyDescTo(newWordTemplate.desc.vi,'en')" color="green">
                                                <v-icon>mdi-transfer-left</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-content-copy</v-icon>
                                            </v-btn>
                                            <v-btn variant="text"  @click="copyDescTo(newWordTemplate.desc.vi,'cn')" color="green">
                                                <v-icon>mdi-content-copy</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-transfer-right</v-icon>
                                            </v-btn>
                                        </div>
                                        <v-textarea auto-grow persistent-hint="" no-resize  variant="outlined" v-model="newWordTemplate.desc.vi" :label="$t('dict.descVi')" dense append-inner-icon="mdi-auto-fix" @click:append-inner="autoGenDesc('vi')"></v-textarea>
                                    </v-col>
                                    <v-col cols="3">
                                        <div v-if="newWordTemplate.desc.cn" class="d-flex justify-space-between my-3">
                                            <v-btn variant="text"  @click="copyDescTo(newWordTemplate.desc.cn,'vi')" color="green">
                                                <v-icon>mdi-transfer-left</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-content-copy</v-icon>
                                            </v-btn>
                                            <v-btn variant="text"  @click="copyDescTo(newWordTemplate.desc.cn,'tw')" color="green">
                                                <v-icon>mdi-content-copy</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-transfer-right</v-icon>
                                            </v-btn>
                                        </div> 
                                        <v-textarea auto-grow persistent-hint="" no-resize  variant="outlined" v-model="newWordTemplate.desc.cn" :label="$t('dict.descCn')" dense append-inner-icon="mdi-auto-fix" @click:append-inner="autoGenDesc('cn')"></v-textarea>
                                    </v-col>
                                    <v-col cols="3">
                                        <div v-if="newWordTemplate.desc.tw" class="d-flex justify-start my-3">
                                            <v-btn variant="text" @click="copyDescTo(newWordTemplate.desc.tw,'cn')" color="green">
                                                <v-icon>mdi-transfer-left</v-icon>
                                                <v-icon class="mx-2">mdi-translate</v-icon>
                                                <v-icon>mdi-content-copy</v-icon>
                                            </v-btn>
                                        </div>
                                        <v-textarea auto-grow persistent-hint="" no-resize variant="outlined" v-model="newWordTemplate.desc.tw" :label="$t('dict.descTw')" dense append-inner-icon="mdi-auto-fix" @click:append-inner="autoGenDesc('tw')"></v-textarea>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                            <v-card-actions>
                                <v-row>
                                    <v-col cols="6">
                                        <v-btn @click="deleteWord" color="red" variant="outlined">
                                            <v-icon>
                                                mdi-delete
                                            </v-icon>
                                            {{ $t('dict.deleteWord') }}
                                        </v-btn>
                                    </v-col>
                                    <v-col cols="6" class="d-flex justify-end" >
                                        <v-btn @click="wordDialog = false" color="red" variant="outlined">
                                            <v-icon>
                                                mdi-close
                                            </v-icon>
                                            {{ $t('dict.cancel') }}
                                        </v-btn>
                                        <v-btn variant="outlined" @click="saveNewWordToDictionary" color="green">
                                            <v-icon>
                                                mdi-content-save
                                            </v-icon>
                                            {{ editMode === 'new' ? $t('dict.saveNewWord') : $t('dict.updateWord') }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                    <v-snackbar
                    color="indigo" 
                    v-model="snackbar"
                    @click="snackbar = false"
                    location="bottom right"
                    >
                    {{ msgText }}
                </v-snackbar>
            </v-container>
        </v-main>
    </v-app>
</v-app>
</template>
<script>
var debounceTimer;
import pinyin from 'pinyin';
import specialChars from '@/assets/specialChar.js';
export default {
    data() {
        return {
            editMode: 'new',
            wordDialog: false,
            uiLang: 'en', // ['en','vi','zh']
            selWord: null,
            langSupports: [
            { text: 'Tiếng Việt', value: 'vi' },
            { text: 'English', value: 'en' },
            { text: 'Chinese simplified', value: 'cn'},
            { text: 'Chinese traditional', value: 'tw'},
            ],
            query: '',
            specialChars,
            server: ['10.13.34.154','10.13.34.154'],
            selServer: '10.13.34.154',
            llmApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            newWordTemplate: {
                uid: null, // for Qdrant collection
                en: '',
                vi: '',
                cn: '',
                tw: '',
                desc: {
                    en: '',
                    vi: '',
                    cn: '',
                    tw: ''
                },
                cats: ['general']
            },
            dictData: [],
            fromLang: 'Tiếng Việt',
            toLang: 'English',
            translation: '',
            snackbar: false,
            msgText: '',
            catsOptions: [
            // with title as multiple langs: 
            {title: {en: 'General', vi: 'Phổ thông', zh: '一般'}, value: 'general'},
            {title: {en: 'Production', vi: 'Sản xuất', zh: '生产'}, value: 'production'},
            {title: {en: 'PCC', vi: 'PCC', zh: 'PCC'}, value: 'pcc'}
            ],
            filterByCat: 'all',
            model: 'llama3-chatqa:latest',
            debouncedTranslate: null,
            debounceTime: 2000,
        };
    },
    methods: {
        async translateByWord(input) {
            let _this = this;
            await fetch(this.ollamaApiComputed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama3-chatqa:latest',
                    prompt: `Translate the text below to other language and responded in JSON format example:
                    JSON: 
                    {en: 'your translated in English', vi: 'your translated in Vietnamese', cn: 'your translated in Chinese simplified', tw: 'your translated in Chinese Traditional'}. Words need to translate word is: ${input}`,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0,
                    }
                })
            }).then(response => response.json())
            .then(data => {
                let _res = JSON.parse(data.response);
                if(_res){
                    console.log('Response:', _res.vi, _res.en, _res.cn, _res.tw);
                    // update newWordTemplate en,vi,zh with the translation base on response, but skip the one that already have value
                    if(!_this.newWordTemplate.en){
                        _this.newWordTemplate.en = _res.en;
                    }
                    if(!_this.newWordTemplate.vi){
                        _this.newWordTemplate.vi = _res.vi;
                    }
                    if(!_this.newWordTemplate.cn){
                        _this.newWordTemplate.cn = _res.cn;
                    }
                    if(!_this.newWordTemplate.tw){
                        _this.newWordTemplate.tw = _res.tw;
                    }
                } else {
                    _this.showSnackbar(this.$t('notify.cannotTranslate'));
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        },
        async autoGenDesc(lang){ 
            let _instruct = {
                en: `Write some context about (${this.newWordTemplate['en']}) in English language then AI will generate the description for you.`,
                vi: `Viết một số ngữ cảnh về từ (${this.newWordTemplate['vi']}) bằng tiếng Việt sau đó AI sẽ tạo mô tả cho bạn.`,
                cn: `用中文寫下該單字(${this.newWordTemplate['cn']})的一些基本訊息，AI將為您產生描述.`,
                tw: `用中文寫下該單字(${this.newWordTemplate['tw']})的一些基本訊息，AI將為您產生描述.`
            }
            let fullLang = {
                en: 'English',
                vi: 'Vietnamese',
                cn: 'simplified Chinese',
                tw: 'Chinese traditional'
            }
            let _context = prompt(_instruct[lang]);
            let _target = this.newWordTemplate[lang];
            let _this = this;
            await fetch(this.ollamaApiComputed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `Write a very short and precise description about "${_target}" with context provided from user as: ${_context} for this word MUST BE IN ${fullLang[lang]} as user requested! and always responded in JSON format as : {output: 'your description'}.`,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0,
                    }
                })
            }).then(response => response.json())
            .then(data => {
                let _res = JSON.parse(data.response);
                _this.newWordTemplate.desc[lang] = _res.output;
                
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        },
        async copyDescTo(desc,lang){
            console.log(desc,lang);
            let _fullLang = {
                en: 'English',
                vi: 'Vietnamese',
                cn: 'simplified Chinese',
                tw: 'traditional Chinese'
            };
            let _this = this;
            await fetch(this.ollamaApiComputed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `Translate 
                    ${desc}
                    
                    to ${_fullLang[lang]} and MUST BE IN ${_fullLang[lang]} as user requested, and always responded in JSON format as : {output: 'your translated text'}.`,
                    format: 'json',
                    stream: false,
                    keep_alive: -1,
                    options: {
                        temperature: 0,
                    }
                })
            }).then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                let _res = JSON.parse(data.response);
                _this.newWordTemplate.desc[lang] = _res.output;
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        },
        async savingTranslationLogs(status,msg){
            // do post request to logsApi with inputText and translation / server
            await fetch(this.logsApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputText: this.inputText,
                    translation: this.translation,
                    server: this.selServer,
                    status,
                    msg
                })
            }).then(response => response.json())
        },
        newWord(){
            this.editMode = 'new';
            this.wordDialog = true;
            this.resetNewWordTemplate();
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
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
            };
        },
        autoTransBlankWords(){
            // auto translate the blank words in newWordTemplate.en or vi or zh
            // find which word is not blank then use that word to translate
            let _input = '';
            if(this.newWordTemplate.en.length){
                _input = this.newWordTemplate.en;
            }else if(this.newWordTemplate.vi.length){
                _input = this.newWordTemplate.vi;
            }else if(this.newWordTemplate.cn.length){
                _input = this.newWordTemplate.cn;
            } else if (this.newWordTemplate.tw.length){
                _input = this.newWordTemplate.tw;
            }
            this.translateByWord(_input);
        },
        async saveNewWordToDictionary(){
            // save newWordTemplate to dictionary
            // do post request to llmApi with newWordTemplate
            
            let _p = this.$t('notify.saveNewWordConfirm');
            if(!confirm(_p)){
                return;
            }
            if(this.newWordTemplate.uid == null){
                let qUid = this.generateUUID();
                this.newWordTemplate.uid = qUid;
            } 
            await fetch(this.llmApi + 'saveNewWordToDictionary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.newWordTemplate)
            }).then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                this.showSnackbar(this.$t('notify.dictNewWordSaved'))
                this.doEmbedingTask(this.newWordTemplate);
                this.resetNewWordTemplate();
                this.wordDialog = false;
                this.getAllWords();
            })
            .catch((error) => {
                console.error('Error:', error);
                // this.showSnackbar('Không thể lưu từ mới vào từ điển, vui lòng thử lại.');
                this.showSnackbar(this.$t('notify.dictNewWordNotSaved'))
            });
        },
        async  getAllWords(){
            // get all words from dictionary
            // do get request to llmApi to get all words
            await fetch(this.llmApi + 'getAllWords')
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                this.dictData = data;
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        },
        async editWord(word){
            console.log('Edit word:', word);
            this.editMode = 'update',
            this.newWordTemplate = word;
            this.wordDialog = true;
        },
        copyToClipboard(ref,text){
            let _ref = this.$refs[ref];
            _ref.select();
            _ref.setSelectionRange(0, 99999); /*For mobile devices*/
            document.execCommand("copy");
            this.showSnackbar(`${text}`);
        },
        async deleteWord(){
            let _p = this.$t('notify.deleteWordConfirm');
            if(!confirm(_p)){
                return;
            }
            // delete word from dictionary
            // do post request to llmApi with newWordTemplate
            await fetch(this.llmApi + 'deleteWord', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.newWordTemplate)
            }).then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                this.showSnackbar(this.$t('notify.dictWordDeleted'))
                this.wordDialog = false;
                this.resetNewWordTemplate();
                this.getAllWords();
            })
            .catch((error) => {
                console.error('Error:', error);
                this.showSnackbar(this.$t('notify.dictWordNotDeleted'))
            });
        },
        resetNewWordTemplate(){
            this.newWordTemplate = {
                uid: null,
                en: '',
                vi: '',
                cn: '',
                tw: '',
                desc: {
                    en: '',
                    vi: '',
                    cn: '',
                    tw: ''
                    
                },
                cats: ['general']
            };
        },
        syncToQdrantCollection(cats, embedding, word){
            let QdrantApi = 'http://10.13.34.154:6333/collections/';
            cats.forEach((cat) => {
                let _cat = cat;
                let _points = {
                    "points": [
                    {
                        "id": word.uid,
                        "vector": embedding,
                        "payload": {word},
                    }
                    ],
                }
                console.log('syncToQdrantCollection:', _cat, _points);
                fetch(QdrantApi + _cat + '/points?wait=true', {
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
            });
        },
        async doEmbedingTask(word){
            let embeddingMdl = 'nextfire/paraphrase-multilingual-minilm:latest';
            // flat the word to string single object including desc
            //ex: {en: 'hello', vi: 'xin chào', zh: '你好', desc: {en: 'greeting', vi: 'lời chào', zh: '问候'}}
            let wordSimpleObj = {
                id: word["_id"]["$oid"],
                uid: word.uid,
                en: word.en,
                vi: word.vi,
                cn: word.cn,
                tw: word.tw,
            };
            // generate the embeding for all words in dictionary
            let embeddingApi = 'http://10.13.34.154:11435/api/embeddings';
            await fetch(embeddingApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: embeddingMdl,
                    prompt: JSON.stringify(wordSimpleObj),
                    keep_alive: -1,
                })
            }).then(response => response.json())
            .then(data => {
                // console.log('vector data:', data);
                this.syncToQdrantCollection(word.cats, data.embedding, wordSimpleObj);
            }).catch((error) => {
                console.error('doEmbedingTask Error:', error);
            });
        },
        renderPinyin(text){
            let _fmt =  pinyin(text,{
                segment: true,
                group: true
            });
            return _fmt.join(' ');
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
        }
        // end of methods || endofmethods || eom
    },
    computed: {
        fmtText() {
            let _input = this.inputText;
            // replace newline break with \n
            _input = _input.replace(/(?:\r\n|\r|\n)/g, '\n');
            // replace special characters
            this.specialChars.forEach((char) => {
                for (let key in char) {
                    _input = _input.replace(new RegExp(key, 'g'), char[key]);
                }
            });
            return _input;
        },
        fuzzyRender(){
            // base on query , use fuzzy search to render the result
            // if query is empty, return all this.fmtRenderResult
            if(this.query === ''){
                return this.fmtRenderResult;
            }else {
                let _query = this.query.toLowerCase();
                return this.fmtRenderResult.filter((word) => {
                    return word.fuzzy.toLowerCase().includes(_query);
                });
            }
        },
        fmtRenderResult(){
            // base on the uiLang to render the item-title for that lang in the first list
            // the other langs left will be in the subtitle 
            // example: if uiLang is 'en', then the item-title will be en, the subtitle will be vi and zh
            // and the desc will be 'en' as well
            let _fmt = this.dictData.map((word) => {
                return {
                    title: word[this.uiLang],
                    subtitle: this.langSupports.filter((lang) => lang.value !== this.uiLang).map((lang) => word[lang.value]).join(' - '),
                    descUi: word.desc[this.uiLang],
                    fuzzy: `${word['en']} ${word['vi']} ${word['cn']} ${word['tw']}` ,
                    // for update data only
                    _id: word._id,
                    uid: word.uid,
                    en: word.en,
                    vi: word.vi,
                    cn: word.cn,
                    tw: word.tw,
                    desc: word.desc,
                    cats: word.cats ? word.cats : [],
                };
            });
            if(this.filterByCat !== 'all'){
                return _fmt.filter((word) => word.cats.includes(this.filterByCat));
            }
            return _fmt;
        },
        piyinFmtComp(){
            if(this.translation && this.toLang.includes('Chinese')){
                let _fmt =  pinyin(this.translation,{
                    segment: true,
                    group: true
                });
                return _fmt.join(' ');
            }
        },
        ollamaApiComputed() {
            return `http://${this.selServer}:11434/api/generate`;
        },
        // end of computed
    },
    watch: {
        // how to watch for the $i18n.locale change
        '$i18n.locale': {
            handler: function (newVal, oldVal) {
                this.uiLang = newVal;
                this.selWord = null;
            },
            immediate: true,
        },
    },
    created() {
        this.debouncedTranslate = this.debounce(this.translate, this.debounceTime || 2000);
        this.getAllWords();
    },
    activated() {
        this.uiLang = this.$i18n.locale;
    },
};
</script>
<style>
::-webkit-scrollbar {
    width: 10px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background-color: #1867C0;
    border-radius: 20px;
    border: 3px solid transparent;
}
</style>
