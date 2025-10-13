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
                                    <div class="d-flex justify-space-between align-center mb-2">
                                        <div class="d-flex flex-column">
                                            <v-btn-toggle 
                                                v-model="selectedQuality" 
                                                mandatory 
                                                variant="outlined" 
                                                class="mb-2"
                                                @update:model-value="updateModelFromQuality"
                                            >
                                                <v-btn value="fast" size="small">{{ $t('trans.fastSpeed') }}</v-btn>
                                                <v-btn value="normal" size="small">{{ $t('trans.normal') }}</v-btn>
                                                <v-btn value="high" size="small">{{ $t('trans.highQuality') }}</v-btn>
                                            </v-btn-toggle>
                                            <small class="text-grey">{{ getModeDescription }}</small>
                                        </div>
                                        <v-btn 
                                            @click="fetchAvailableModels" 
                                            icon="mdi-refresh" 
                                            size="small" 
                                            variant="outlined"                                            :loading="modelsLoading"
                                        ></v-btn>
                                    </div>
                                      <!-- Image functionality for vision models -->
                                    <div v-if="isVisionModel" class="mb-3">                                        <v-alert type="info" variant="outlined" class="mb-2">
                                            <v-icon start>mdi-eye</v-icon>
                                            {{ $t('trans.visionMode') }}
                                        </v-alert><div class="d-flex gap-2 mb-2">                                            <v-btn @click="triggerImageUpload" variant="outlined" size="small" prepend-icon="mdi-upload" :loading="isExtractingText">
                                                {{ $t('trans.uploadImage') }}
                                            </v-btn>
                                            <v-btn @click="clearImage" v-if="uploadedImage" variant="outlined" size="small" color="red" prepend-icon="mdi-delete">
                                                {{ $t('trans.clearImage') }}
                                            </v-btn>
                                            <v-chip v-if="uploadedImage" color="success" size="small">{{ $t('trans.imageReady') }}</v-chip>
                                        </div>
                                        <v-img 
                                            v-if="uploadedImage" 
                                            :src="uploadedImage" 
                                            max-height="200" 
                                            max-width="300" 
                                            class="mb-2 rounded"
                                            contain
                                        ></v-img>
                                        <input 
                                            ref="imageInput" 
                                            type="file" 
                                            accept="image/*" 
                                            @change="handleImageUpload" 
                                            style="display: none"
                                        />
                                    </div>

                                    <div class="d-flex justify-space-between align-center">
                                        <div class="d-flex justify-space-between">
                                            <v-checkbox hide-details="" v-for="(cat, index) in dictCatsComp"
                                            :key="index" :label="cat[$i18n.locale]" v-model="selDictCat"
                                            :value="cat.value" class="text-capitalize"></v-checkbox>
                                        </div>
                                        <div>
                                        <v-btn :loading="isTranslating" variant="outlined" color="red" class="ml-2" @click="postTranslate"
                                        prepend-icon="mdi-translate">
                                        {{ $t('trans.translate') }}
                                    </v-btn>
                                </div>
                            </div>
                            <v-textarea clearable="" :placeholder="$t('trans.sourceTransPlaceholder')" hide-details="" auto-grow variant="outlined"
                            v-model="inputText"></v-textarea>
                            <code>{{ currentModel }}</code>
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
                            <div>
                                <v-btn @click="rateTranslated('dislike')" icon size="x-small" variant="outlined" :color="improvedTrans.rateSel === 'dislike' ? 'orange':'orange-lighten-3'" class="mr-2">
                                    <v-icon>mdi-thumb-down</v-icon>
                                </v-btn>
                                <v-btn @click="rateTranslated('like')" icon size="x-small" variant="outlined" :color="improvedTrans.rateSel  === 'like' ? 'green':'green-lighten-3'" class="mr-2">
                                    <v-icon>mdi-thumb-up</v-icon>
                                </v-btn>
                            </div>
                            <div>
                                <v-btn variant="outlined" size="x-small" icon @click="copyContent" color="primary">
                                    <v-icon left>mdi-content-copy</v-icon>
                                </v-btn>
                                <v-btn v-if="this.toLang.langCode != 'vi'" class="ml-1" variant="outlined" size="x-small" icon @click="speakTheText(internalDictOutputComp.raw)" color="primary">
                                    <v-icon left>mdi-volume-high</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </div>
                    <div class="rounded pa-3" style="border: 1px solid #ddd;" v-else>
                        {{ $t('trans.waitingForUserInput') }}
                    </div>
                    <v-alert v-if="piyinFmtComp" variant="outlined" color="grey" class="mt-2 pa-1">
                        <small>{{ piyinFmtComp }}</small>
                    </v-alert>
                   
               
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
        
        <!-- dictionary lookup dialogs -->
        <v-dialog v-model="dictLookup.dialog" max-width="950">
            <v-card>
                <v-card-text>
                    <!-- {{ dictLookup.response }} -->
                    <!-- { "origin_word": "xe hơi", "translations": { "vi": "ô tô", "en": "car", "cn": "汽车" }, "pronunciation": { "en": "kɑːr", "vi": "ô tô", "cn": "chē" }, "part_of_speech": "noun", "examples": { "en": "I love driving my car.", "vi": "Tôi yêu thích lái xe của mình.", "cn": "我喜欢开车。" }, "synonyms": { "en": [ "motor vehicle", "automobile", "car" ], "vi": [ "ô tô", "xe hơi", "chiếc xe" ], "cn": [ "汽车", "轿车", "小汽车" ] }, "antonyms": { "en": [ "bike", "moped" ], "vi": [ "xe đạp", "xe máy" ], "cn": [ "自行车", "摩托车" ] }, "other_meanings": { "en": [ "a means of transport powered by an internal combustion engine", "a vehicle with four wheels and an engine" ], "vi": [ "phương tiện di chuyển được vận hành bằng động cơ đốt trong", "chiếc xe có bốn bánh và động cơ" ], "cn": [ "由内燃机驱动的交通工具", "有四个轮子和发动机的车辆" ] }, "idioms_and_phrases": { "en": [ "car trouble", "get behind the wheel" ], "vi": [ "vấn đề xe hơi", "lái xe" ], "cn": [ "汽车问题", "上车" ] }, "grammar_and_usage": { "en": "Can be used as a countable or uncountable noun.", "vi": "Có thể được sử dụng như một danh từ số ít hoặc số nhiều.", "cn": "可以用作可数名词或不可数名词。" } } -->
                    <!-- create ui for display above data -->
                    <v-row>
                        <v-col cols="12">
                            <div class="d-flex justify-end">
                                <v-btn @click="dictLookup.dialog = false" variant="text" color="red">
                                    {{ $t('ui.cancel') }}
                                </v-btn>
                            </div>
                            <table class="simpleTable">
                                <thead>
                                    <tr>
                                        <th colspan="3" class="text-uppercase text-center" v-text="dictLookup.response.origin_word"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <h4 class="text-capitalize" v-text="dictLookup.response.translations.vi"></h4>
                                            (<span class="text-capitalize" v-text="dictLookup.response.pronunciation.vi"></span>)
                                        </td>
                                        <td>
                                            <h4 class="text-capitalize" v-text="dictLookup.response.translations.en"></h4>
                                            (<span class="text-capitalize" v-text="dictLookup.response.pronunciation.en"></span>)
                                        </td>
                                        <td>
                                            <h4 class="text-capitalize" v-text="dictLookup.response.translations.cn"></h4>
                                            (<span class="text-capitalize" v-text="dictLookup.response.pronunciation.cn"></span>)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <p class="text-capitalize" v-text="dictLookup.response.part_of_speech"></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th colspan="3" class="text-center">
                                            {{ $t('trans.exampleTitle') }}
                                        </th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <p v-text="dictLookup.response.examples.vi"></p>
                                        </td>
                                        <td>
                                            <p v-text="dictLookup.response.examples.en"></p>
                                        </td>
                                        <td>
                                            <p v-text="dictLookup.response.examples.cn"></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th colspan="3" class="text-center">
                                            {{ $t('trans.synonymsTitle') }}
                                        </th>
                                    </tr>
                                    <tr>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.synonyms.vi" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.synonyms.en" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.synonyms.cn" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th colspan="3" class="text-center">
                                            {{ $t('trans.antonymsTitle') }}
                                        </th>
                                    </tr>
                                    <tr>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.antonyms.vi" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.antonyms.en" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.antonyms.cn" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                    </tr>
                                    <!-- other_meanings -->
                                    <tr>
                                        <th colspan="3" class="text-center">
                                            {{ $t('trans.otherMeaningTitle') }}
                                        </th>
                                    </tr>
                                    <tr>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.other_meanings.vi" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.other_meanings.en" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.other_meanings.cn" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                    </tr>
                                    <!-- idioms_and_phrases -->
                                    <tr>
                                        <th colspan="3" class="text-center">
                                            {{ $t('trans.ididiomsTitle') }}
                                        </th>
                                    </tr>
                                    <tr>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.idioms_and_phrases.vi" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.idioms_and_phrases.en" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                        <td class="text-capitalize">
                                            <template v-for="(s,sIndex) of dictLookup.response.idioms_and_phrases.cn" :key="sIndex">
                                                <v-chip class="ml-1 mb-1" variant="outlined" size="small" color="blue">{{ s }}</v-chip>
                                            </template>
                                        </td>
                                    </tr>


                                </tbody>
                            </table>
                            <v-alert>
                                {{ $t('trans.dictAiWarning') }}
                            </v-alert>
                        </v-col>
                    </v-row>
                </v-card-text>
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
// Add Levenshtein function at the top level
function levenshtein(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    if (s1.length < s2.length) {
        return levenshtein(s2, s1);
    }
    if (s2.length === 0) {
        return s1.length;
    }
    let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
    for (let i = 0; i < s1.length; i++) {
        let currentRow = [i + 1];
        for (let j = 0; j < s2.length; j++) {
            let insertions = previousRow[j + 1] + 1;
            let deletions = currentRow[j] + 1;
            let substitutions = previousRow[j] + (s1[i] === s2[j] ? 0 : 1);
            currentRow.push(Math.min(insertions, deletions, substitutions));
        }
        previousRow = currentRow;
    }
    return previousRow[previousRow.length - 1];
}

const LEVENSHTEIN_THRESHOLD = 1;

var debounceTimer;
const selModel = 'qwen3:8b';
import specialChars from '@/assets/specialChar.js';
import dirtyJson from 'dirty-json';
import pinyin from 'pinyin';

export default {
    data() {
        return {
            specialChars,
            currentModel: selModel,
            logsApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            llmApi: 'http://gmo021.cansportsvg.com/api/vg-llm/',
            ollamaBaseUrl: 'http://10.13.34.181:11434',
            // Model selection
            selectedModel: 'qwen3:8b', // Default to fast model
            selectedQuality: 'fast', // Default quality selection
            availableModels: [],
            modelsLoading: false,
            // Translation state
            fromLang: 'Tiếng Việt',
            toLang: {
                text: {
                    en: 'English',
                    vi: 'Tiếng Anh',
                    zh: '英语'
                },
                langCode: 'en',
                value: 'English',
                model: selModel,
            },
            inputText: '',
            translation: '',
            enhancedTrans: '',
            enhanceSource:{
                output: null,
                isLoading: false,
                debug: null,
            },
            dictLookup: {
                dialog: false,
                isLoading: false,
                response: {},
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
                    model: selModel,
                },
                {
                    text: {
                        en: 'English',
                        vi: 'Tiếng Anh',
                        zh: '英语'
                    },
                    langCode: 'en',
                    value: 'English',
                    model: selModel,
                },
                {
                    text: {
                        en: 'Chinese (Simplified)',
                        vi: 'Tiếng Trung (Giản thể)',
                        zh: '简体中文'
                    },
                    langCode: 'cn',
                    value: 'Chinese (Simplified)',
                    model: selModel,
                },
                {
                    text: {
                        en: 'Chinese (Traditional)',
                        vi: 'Tiếng Trung (Phồn thể)',
                        zh: '繁体中文'
                    },
                    langCode: 'tw',
                    value: 'Chinese (Traditional)',
                    model: selModel,
                },
            ],
            agents: [
                {
                    model: selModel,
                    port: '11434',
                    ip: '10.13.34.181',
                    role: 'translator',
                },
                {
                    model: selModel,
                    port: '11434',
                    ip: '10.13.34.181',
                    role: 'translator',
                },
                {
                    model: selModel,
                    port: '11436',
                    ip: '10.13.34.181',
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
            selDictCat: [],
            isTransError: false,
            improvedTrans: {
                rateSel: null, // up or down
                translatedId: '', // for update the translation rate
                dialog: false,
                msg: '',
            },
            isTranslating: false,
            detectedLangCode: null,
            uploadedImage: null,
            uploadedImageBase64: null,
            isExtractingText: false,
            clipboardPasteEnabled: true,
        };
    },
    methods: {
        /**
         * MAIN FUNCTION: Fetches the list of available LLM models from the Ollama server,
         * filters them to only allowed models, and updates the UI model list.
         */
        async fetchAvailableModels() {
            this.modelsLoading = true;
            try {
                const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch models: ${response.statusText}`);
                }
                const data = await response.json();
                // Keep only allowed models (normalize entries to objects with a `name` property)
                const allowed = [
                    'qwen3:8b', // fast
                    'gemma3:12b', // normal quality  
                    'qwen3:32b', // slow, high quality
                    'qwen2.5vl:latest', // vision only
                ];
                const rawModels = data.models || [];
                const filtered = rawModels
                    .filter(m => {
                        const name = (typeof m === 'string') ? m : (m && m.name);
                        return allowed.includes(name);
                    })
                    .map(m => (typeof m === 'string' ? { name: m } : m));

                // If none of the allowed models returned from the server, fall back to allowed list
                this.availableModels = filtered.length > 0 ? filtered : allowed.map(n => ({ name: n }));
                console.log('Available models (filtered):', this.availableModels);

                // Set default model if not already selected
                if (!this.selectedModel && this.availableModels.length > 0) {
                    this.selectedModel = this.availableModels[0].name;
                }
            } catch (error) {
                console.error('Error fetching models:', error);
                this.showSnackbar(`Error fetching models: ${error.message}`);
            } finally {
                this.modelsLoading = false;
            }
        },

        /**
         * Updates the selected model based on the user's chosen translation quality (fast/normal/high).
         * Falls back to available models if the preferred one is missing.
         */
        updateModelFromQuality(quality) {
            const modelMap = {
                'fast': 'qwen3:8b',
                'normal': 'gemma3:12b',
                'high': 'qwen3:32b'
            };
            
            // Check if the selected model is available, otherwise fallback to fast
            const targetModel = modelMap[quality];
            if (this.availableModels.some(m => m.name === targetModel)) {
                this.selectedModel = targetModel;
                console.log(`Quality changed to ${quality}, using model: ${this.selectedModel}`);
            } else {
                // Try fallback models in order of preference
                const fallbackOrder = ['qwen3:8b', 'gemma3:12b', 'qwen3:32b'];
                let fallbackModel = null;
                
                for (const model of fallbackOrder) {
                    if (this.availableModels.some(m => m.name === model)) {
                        fallbackModel = model;
                        break;
                    }
                }
                
                if (fallbackModel) {
                    this.selectedModel = fallbackModel;
                    console.log(`Model ${targetModel} not available, falling back to ${fallbackModel}`);
                    this.showSnackbar(`Model not available, switched to ${fallbackModel.split(':')[0]}`);
                } else {
                    // Last resort fallback
                    this.selectedModel = modelMap['fast'];
                    console.log(`No preferred models available, using fast model as last resort`);
                    this.showSnackbar('Preferred model not available, using fallback');
                }
            }
        },

        /**
         * (Disabled) Would match words in the input against an internal dictionary.
         * Currently keeps dictData empty for a simplified flow.
         */
        dictionaryMatching() {
            // Internal dictionary matching disabled.
            // Keep dictData empty to simplify translation flow.
            this.dictData = [];
        },

        /**
         * (Disabled) Would perform a dictionary lookup for a word.
         * Currently shows a snackbar that the feature is disabled.
         */
        async dictionaryLookup(){
            // Dictionary lookup disabled in simplified translation mode.
            this.dictLookup.isLoading = false;
            this.showSnackbar('Dictionary feature is disabled.');
        },

        /**
         * MAIN FUNCTION: Entry point for translation when user clicks "Translate" button.
         * Calls the main translate() function.
         */
        postTranslate(){
            // Simplified post-translate: just translate the input.
            this.translate();
        },

        /**
         * MAIN FUNCTION: Handles the translation process.
         * - Validates input
         * - Calls Ollama API with selected model and prompt
         * - Handles JSON and fallback responses
         * - Updates translation output and logs translation to backend
         * - Handles errors and UI state
         */
        async translate() {
            this.isTranslating = true;
            this.isTransError = false;
            this.enhancedTrans = '';
            
            // Clear image UI when translation starts
            this.clearImage();
            
            clearTimeout(debounceTimer);
            let _this = this;
            if (this.inputText === '') {
                this.showSnackbar(this.$t('notify.emptyInput'));
                this.isTranslating = false;
                return;
            }
            this.translation = 'Translating...';
            
            try {
                const response = await fetch(this.ollamaApiComputed, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.selectedModel,
                        system: this.systemPromptComp,
                        prompt: this.transPromptComp,
                        format: 'json',
                        stream: false,
                        keep_alive: -1,
                        options: {
                            temperature: 0,
                            num_ctx: 4096,
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Raw API response:', data);

                if (!data.response) {
                    throw new Error('Empty response from API');
                }

                this.isTranslating = false;
                this.detectedLangCode = null;
                
                try {
                    let _response = JSON.parse(data.response);
                    if (_response.output) {
                        console.log('Parsed response:', _response);
                        _this.translation = _response.output;
                        _this.detectedLangCode = _response.source_lang_code;

                        // Save translation log to server
                        const payload = {
                            input: this.fmtText.replace(/\\n/g, '\n'),
                            source_lang: _this.detectedLangCode || null,
                            target_lang: this.toLang.langCode,
                            user_feedback: {
                                msg: this.improvedTrans.msg || '',
                                actions: this.improvedTrans.rateSel || ''
                            },
                            output: _response.output,
                            mode: this.selectedModel
                        };
                        this.saveTransLog(payload);
                    } else {
                        throw new Error('No output in parsed response');
                    }
                } catch (parseError) {
                    console.log('JSON parse error:', parseError);
                    console.log('Raw response that failed to parse:', data.response);
                    
                    // Try to extract text from non-JSON response as fallback
                    if (typeof data.response === 'string' && data.response.trim()) {
                        _this.translation = data.response;
                        console.log('Using raw response as fallback');
                    } else {
                        _this.translation = 'Error: Unable to parse response';
                        this.showSnackbar('Translation failed - model may be unavailable. Try switching to a different quality mode.');
                        this.isTransError = true;
                    }
                }
            } catch (error) {
                console.error('Translation error:', error);
                _this.translation = `Error: ${error.message}`;
                this.isTransError = true;
                this.isTranslating = false;
                
                // Suggest trying a different model
                this.showSnackbar(`Translation failed: ${error.message}. Try switching to Normal or High Quality mode.`);
            }
        },
        
        /**
         * Submits user feedback (like/dislike and comments) for a translation to the backend.
         * Uses the translation log ID to update feedback.
         */
        submitTranslateFeedback(){
            // Use the saved trans log id to PUT user feedback (already mapped to allowed values)
            const logId = this.improvedTrans.translatedId;
            const feedback = {
                msg: this.improvedTrans.msg || null,
                actions: this.improvedTrans.rateSel || null
            };
            this.updateTransLogFeedback(logId, feedback);
        },
        /**
         * Copies the translation output to the clipboard and shows a notification.
         */
        copyContent() {
            let copyText = document.getElementById("output");
            copyText.select();
            copyText.setSelectionRange(0, 99999); /*For mobile devices*/
            document.execCommand("copy");
            this.showSnackbar(this.$t('notify.copied'));
        },
        /**
         * Shows a snackbar notification with the provided message for 3 seconds.
         */
        showSnackbar(msg) {
            this.msgText = msg;
            this.snackbar = true;
            setTimeout(() => {
                this.snackbar = false;
                this.msgText = msg;
            }, 3000);
        },
        /**
         * Returns a debounced version of a function, delaying its execution by the given delay.
         */
        debounce(func, delay) {
            return function () {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
            };
        },
        /**
         * (Disabled) Would fetch all words for dictionary highlighting.
         * Currently keeps highLightDictData empty.
         */
        async getAllWords() {
            // Dictionary fetching disabled in simplified mode.
            this.highLightDictData = [];
        },
        /**
         * Sends the current translation to the LLM for enhancement/revision and updates enhancedTrans.
         * Uses a specific prompt to improve translation quality.
         */
        async enhanceTheTranslation() {
            // do post request to ollama Api to get the revised translation
            await fetch('http://10.13.34.181:11434/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen3:8b',
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
        /**
         * (Disabled) Would revise a JSON translation result using an agent.
         */
        async jsonReviseAgent(rawJson) {
            // JSON revise agent removed in simplified flow.
            console.log('jsonReviseAgent: disabled');
        },
        /**
         * Handles user rating (like/dislike) for a translation.
         * Opens feedback dialog for 'dislike', immediately updates for 'like'.
         */
        rateTranslated(action) {
            // action should be 'like' or 'dislike'
            if (action !== 'like' && action !== 'dislike') {
                console.warn('Unsupported rating action:', action);
                return;
            }
            this.improvedTrans.rateSel = action;

            if (action === 'dislike') {
                // open dialog and let user provide msg (dialog bound to improvedTrans.msg)
                this.showSnackbar(this.$t('notify.yourFeedbackIsVeryImportant'));
                this.improvedTrans.dialog = true;
            } else {
                // immediate update for 'like'
                const logId = this.improvedTrans.translatedId;
                const feedback = {
                    msg: null,
                    actions: 'like'
                };
                this.updateTransLogFeedback(logId, feedback);
            }
        },

        /**
         * Applies the enhanced translation (from enhanceTheTranslation) to the main translation output.
         */
        applyEnhancedTrans() {
            this.translation = this.enhancedTrans;
            this.enhancedTrans = '';
        },
        /**
         * Sends the source text to the LLM for enhancement (clarity, grammar) and updates enhanceSource.
         */
        async enhanceSourceText(){
            // do post request to ollama Api to get the enhance the meaning of the source text
            this.enhanceSource.isLoading = true;
            await fetch('http://10.13.34.181:11434/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen3:8b',
                    system: `YOU ARE A LANGUAGE TEACHER WITH 20 YEAR OF EXPERIENCE. DO NOT ENGAGE IN CONVERSATION. ALWAYS RETURN YOUR RESULT IN JSON FORMAT.`,
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
                this.enhanceSource.debug = null;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        /**
         * Sends the source text to the LLM for grammar and typo correction and updates enhanceSource.
         */
        async fixingGrammar(){
            // do post request to ollama Api to get the grammar revise of the source text
            this.enhanceSource.isLoading = true;
            await fetch('http://10.13.34.181:11434/api/generate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'aya:latest',
                    system: `YOU ARE A LANGUAGE EXPERT WITH 20 YEAR OF EXPERIENCE. DO NOT ENGAGE IN CONVERSATION. JUST RETURN YOUR RESULT IN JSON FORMAT NOTHING ELSE.`,
                    prompt: `Fixing typos and grammar on the source text below. Only return the revised version in JSON format:
                    __
                    Source text for reference: ${this.fmtText}
                    __
                    JSON:{"output":"your fixing version of the text", "debug": "your fixing version but wrapping the fixed words, grammar fixing with <b> tag."}
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
                this.enhanceSource.debug = _r.debug;
                this.enhanceSource.isLoading = false;
            }).catch((error) => {
                console.error('Error:', error);
            });
        },
        /**
         * Applies the enhanced source text (from enhanceSourceText or fixingGrammar) to the input field.
         */
        applyTheEnhancement(){
            this.inputText = this.enhanceSource.output;
            this.enhanceSource.output = null;
            this.enhanceSource.isLoading = false;
        },
        /**
         * Parses a "dirty" (non-standard) JSON string into a JS object using dirty-json.
         * Useful for handling imperfect LLM outputs.
         */
        parseDirtyJson(dirtyJsonString) {
            try {
                // Use dirtyJson.parse to convert a dirty JSON string to an object
                const cleanObject = dirtyJson.parse(dirtyJsonString);
                return cleanObject;
                // Use the clean object as needed
            } catch (error) {
                console.error("Error parsing dirty JSON:", error);
            }
        },
        /**
         * Uses browser Text-to-Speech to read aloud the provided text in the target language.
         * Sets language and rate based on target language.
         */
        speakTheText(text){
            // stop any speaking text
            window.speechSynthesis.cancel();
            // use chrome tts to speak the text
            let _msg = new SpeechSynthesisUtterance(text);
            // how to detect the language of the text
            // lower the speed to 80%
            _msg.rate = 0.8;
            switch(this.toLang.langCode){
                case 'vi':
                _msg.lang = 'vi-VN';
                break;
                case 'en':
                _msg.lang = 'en-US';
                break;
                case 'cn':
                // _msg.lang = 'zh-CN';
                _msg.lang = 'zh-TW';
                break;
                case 'tw':
                _msg.lang = 'zh-TW';
                break;
            }
            console.log('Speaking:',  _msg.lang);
            window.speechSynthesis.speak(_msg);
        },
        // Image handling methods
        triggerImageUpload() {
            this.$refs.imageInput.click();
        },
          handleImageUpload(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    this.uploadedImage = e.target.result;
                    this.uploadedImageBase64 = e.target.result.split(',')[1];
                    // Automatically perform OCR after image is loaded
                    await this.extractTextFromImage();
                };
                reader.readAsDataURL(file);
            }
            // Clear input value to allow uploading the same file again
            event.target.value = '';
        },        /**
         * MAIN FUNCTION: Extracts text from the uploaded image using the vision model (OCR) and updates inputText.
         * Handles timeouts and error feedback.
         */
        async extractTextFromImage() {
            if (!this.uploadedImage) {
                this.showSnackbar('Please upload an image first');
                return;
            }

            this.isExtractingText = true;
            try {
                // Create an AbortController for the timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                // Use vision model for OCR only
                const response = await fetch(this.ollamaApiComputed, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'qwen2.5vl:latest', // Always use vision model for OCR
                        prompt: 'Extract all visible text from this image. Return only the text, nothing else.',
                        images: [this.uploadedImageBase64],
                        stream: false,
                        options: {
                            temperature: 0
                        }
                    }),
                    signal: controller.signal // Add the abort signal
                });

                // Clear the timeout since the request completed
                clearTimeout(timeoutId);

                const data = await response.json();
                if (data.response) {
                    // Clean up the response - remove any additional explanations
                    const cleanedText = data.response
                        .replace(/^(Here('s| is) the text( from the image)?:?\s*)/i, '')
                        .replace(/^I see the following text:?\s*/i, '')
                        .replace(/^The text in the image (reads|says):?\s*/i, '')
                        .trim();
                    this.inputText = cleanedText;
                }
            } catch (error) {
                console.error('Error in OCR:', error);
                if (error.name === 'AbortError') {
                    this.showSnackbar('OCR processing took too long. If the image is large, try reducing its size.');
                } else {
                    this.showSnackbar('Error extracting text from image. Please try again.');
                }
                // Clear the image if OCR failed
                this.clearImage();
            } finally {
                this.isExtractingText = false;
            }
        },

        /**
         * Sets up clipboard paste event listener for image OCR (enables pasting images directly).
         */
        setupClipboardPaste() {
            if (this.clipboardPasteEnabled) {
                document.addEventListener('paste', this.handleClipboardPaste);
            }
        },

        /**
         * Removes clipboard paste event listener.
         */
        cleanupClipboardPaste() {
            document.removeEventListener('paste', this.handleClipboardPaste);
        },        /**
         * Handles pasted images from clipboard, reads as base64, and triggers OCR.
         */
        async handleClipboardPaste(event) {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    event.preventDefault();
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        // Set image and trigger OCR using vision model
                        this.uploadedImage = e.target.result;
                        this.uploadedImageBase64 = e.target.result.split(',')[1];
                        
                        // Perform OCR immediately (will use qwen2.5vl:latest internally)
                        await this.extractTextFromImage();
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        },

        /**
         * Clears the uploaded image and resets related state/UI.
         */
        clearImage() {
            this.uploadedImage = null;
            this.uploadedImageBase64 = null;
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = '';
            }
        },
        
        /**
         * Saves the translation log to the backend server for future feedback/rating.
         * Stores the returned log ID for later updates.
         */
        async saveTransLog(logPayload) {
            try {
                const resp = await fetch('http://gmo021.cansportsvg.com:1080/ai-translate/trans_logs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logPayload)
                });
                if (!resp.ok) {
                    console.error('Failed to save trans log:', resp.status, resp.statusText);
                    return;
                }
                const data = await resp.json();
                // Log returned id for dev tools
                console.log('Trans log saved id:', data.id);
                // store id for later updates (rating/feedback)
                if (data && data.id) {
                    this.improvedTrans.translatedId = data.id;
                }
                return data;
            } catch (err) {
                console.error('Error saving trans log:', err);
            }
        },

        /**
         * Updates the translation log with user feedback (like/dislike, comments) using PUT.
         */
        async updateTransLogFeedback(logId, feedback) {
            if (!logId) {
                console.error('No log id available to update');
                this.showSnackbar('Unable to submit feedback: missing log id.');
                return;
            }
            try {
                const payload = {
                    input: this.fmtText.replace(/\\n/g, '\n'),
                    source_lang: this.detectedLangCode || null,
                    target_lang: this.toLang.langCode,
                    user_feedback: {
                        msg: feedback && feedback.msg ? feedback.msg : null,
                        actions: feedback && feedback.actions ? feedback.actions : null
                    },
                    output: this.translation || '',
                    mode: this.selectedModel
                };

                const url = `http://gmo021.cansportsvg.com:1080/ai-translate/trans_logs/${logId}`;
                // Use PUT because backend exposes PUT for updates (ref_main.py)
                const resp = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                    console.error('Failed to update trans log:', resp.status, resp.statusText);
                    this.showSnackbar('Failed to submit feedback.');
                    return;
                }
                const data = await resp.json();
                console.log('Trans log updated:', data);
                this.showSnackbar(this.$t('notify.thankYouForRating'));
                // close dialog if open
                this.improvedTrans.dialog = false;
                // clear feedback textarea when user submitted a dislike
                if (payload.user_feedback && payload.user_feedback.actions === 'dislike') {
                    this.improvedTrans.msg = '';
                }
                return data;
            } catch (err) {
                console.error('Error updating trans log:', err);
                this.showSnackbar('Error submitting feedback.');
            }
        },

    },
    computed: {
        // Vision model detection for multimodal capabilities (only shows UI when image is present)
        isVisionModel() {
            // Show vision UI only when user has uploaded an image
            return this.uploadedImage !== null;
        },
        ollamaApiComputed() {
            return `${this.ollamaBaseUrl}/api/generate`;
        },

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
            return `You are a professional translator. Translate the given text accurately while preserving its original meaning, tone, and context. Ensure proper grammar and fluency in the target language. Always return the result in JSON format with the structure: {"output": "translated text", "source_lang_code": "detected language code"}. Do not add any explanations or extra text.`;
        },
        piyinFmtComp() {
            if (this.internalDictOutputComp && this.internalDictOutputComp.raw && ['cn','tw'].includes(this.toLang.langCode)) {
                let _cleaned = this.internalDictOutputComp.raw.replace(/<b>/g, '').replace(/<\/b>/g, '');
                let _fmt = pinyin(_cleaned, {
                    segment: true,
                    group: true
                });
                return _fmt.join(' ');
            }
            return '';
            },
            dictDataFmt() {
                // Internal dictionary disabled - no extra context
                return '';
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
                // No dictionary output in simplified mode
                return '';
            },
            transPromptComp() {
                return `Translate the following text to ${this.toLang.value}. Return only JSON format:
{"output": "translated text", "source_lang_code": "detected language code"}

Text to translate:
${this.fmtText}`;
            },
            internalDictOutputComp() {
                if(!this.translation || this.translation === 'Translating...'){
                    return false;
                }
                let _output = this.translation;
                let _htmlOutput = this.translation.replace(/\n/g, '<br>');
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
            },
            getModeDescription() {
                const descriptions = {
                    'fast': this.$t('trans.fastSpeedDesc'),
                    'normal': this.$t('trans.normalDesc'),
                    'high': this.$t('trans.highQualityDesc')
                };
                return descriptions[this.selectedQuality] || '';
            }
            // end of computed || eoc
        },
        watch: {
            selectedModel(newModel) {
                console.log('Model changed to:', newModel);
                this.currentModel = newModel;
            }
        },        created() {
        // Simplified initialization: fetch available models and clipboard handling
        this.fetchAvailableModels();
        this.setupClipboardPaste();
        },

        beforeDestroy() {
            this.cleanupClipboardPaste();
        },
        activated() {
            this.fetchAvailableModels();
        },
    };
</script>

<style>
#output b {
    text-decoration: underline;
    color: orange;
}
/* mininal table decorate .simpleTable*/
.simpleTable {
    border-collapse: collapse;
    width: 100%;
}
.simpleTable th, .simpleTable td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
.simpleTable th {
    background-color: #f2f2f2;
}
.simpleTable tr:nth-child(even) {
    background-color: #f2f2f2;
}
.simpleTable tr:hover {
    background-color: #f1f1f1;
}


</style>
