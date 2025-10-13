import { APIChain } from "langchain/chains";
import MarkdownIt from 'markdown-it';
import { chatWrapper } from "./Meal.vue";

export default (await import('vue')).defineComponent({
data() {
return {
typingGif,
newMessage: '',
stream: '',
messages: [],
selectedItem: null,
isStream: false,
model: 'chat13b:latest',
modelListing: [],
renderMode: 'md', // md or plaintext
isWaiting: true,
ragFile: null,
vectorStore: null,
};
},
methods: {
async APIChain() {
const API_DOC = `API Documentation
BASE URL: gmo021.cansportsvg.com/api/vg-menu/llm-get-meal/empno/today
Endpoint Description
This API endpoint provides information about meals for a given employee (empno) on a specific date (today).
Parameter	Format	Required	Default	Description
empno
Type: String
Format: 5 characters (e.g., '00001', '11522')
Required: Yes
Description: The employee number.
today
Type: Date
Format: YYYY-MM-DD (e.g., 2024-01-23)
Required: Yes
Description: The date for which meal information is requested. Should be in the format YYYY-MM-DD.
`;
const model = new OpenAI({ modelName: "gpt-3.5-turbo-instruct" });
const chain = APIChain.fromLLMAndAPIDocs(model, OPEN_METEO_DOCS, {
headers: {
// These headers will be used for API requests made by the chain.
},
});
const res = await chain.call({
question: "What is the weather like right now in Munich, Germany in degrees Farenheit?",
});
console.log({ res });
},
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
async sendMessage() {
if (this.newMessage.trim() !== '') {
this.messages.push({
role: 'user',
content: this.newMessage,
content_plain: this.newMessage.replace(/\n/g, '<br/>'),
show: true,
});
this.newMessage = '';
this.messages.push({
role: 'assistant',
content: '',
show: true,
});
await this.chat([this.messages[this.messages.length - 1]]);
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
if (_j.done) {
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
this.sendMessage();
}
}
},
async processingRAG(doc) {
const embeddings = new OllamaEmbeddings({
model: "llama2",
baseUrl: "http://10.13.34.154:11434",
options: {
temperature: 0.1,
}
});
const loader = new TextLoader(doc);
const docs = await loader.load();
const splitter = new RecursiveCharacterTextSplitter({
chunkSize: 1000,
chunkOverlap: 100,
});
const docOutput = await splitter.splitDocuments([
new Document({ pageContent: docs[0]['pageContent'] }),
]);
const baseCompressor = LLMChainExtractor.fromLLM(embeddings);
const vectorStore = await HNSWLib.fromDocuments(docOutput, embeddings);
const retriever = new ContextualCompressionRetriever({
baseCompressor,
baseRetriever: vectorStore.asRetriever(),
});
const retrievedDocs = await retriever.getRelevantDocuments(
"When did we got Nike Shoe Dogs award ?"
);
console.log(retrievedDocs);
// this.doRagQuery(prompt("Enter your query: ", "Nike Shoe Dogs"));
},
handleFileUpload(event) {
const file = event.target.files[0];
this.processingRAG(file);
},
triggerFileInputDialog() {
this.$refs.fileInput.click();
},
async doRagQuery(query) {
const resultOne = await this.vectorStore.similaritySearch(query, 1);
resultOne.map((result) => {
console.log(result.pageContent);
});
}
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
this.getModelListing();
chatWrapper = document.getElementById('chatWrapper');
setInterval(() => {
if (this.isStream) {
chatWrapper.scrollTop = chatWrapper.scrollHeight;
}
}, 200);
},
});
