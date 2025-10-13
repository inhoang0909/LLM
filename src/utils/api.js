import axios from "axios";

const OLLAMA_BASE = import.meta.env.VITE_OLLAMA_BASE;
const LOG_BASE = import.meta.env.VITE_LOG_BASE;
const TRANSLATE_API = import.meta.env.VITE_TRANSLATE_API;

const api = axios.create({
  headers: { "Content-Type": "application/json" }
});

async function jsonFetch(url, opts = {}) {
  try {
    const res = await api({ url, ...opts });
    return res.data;
  } catch (err) {
    console.error("API error:", url, err?.response?.status, err?.message);
    throw err;
  }
}

export function fetchModels() {
  return jsonFetch(`${OLLAMA_BASE}/api/tags`);
}

export function generate(body) {
  return jsonFetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    data: body
  });
}

export async function saveLog(payload) {
  try {
    return await jsonFetch(`${LOG_BASE}/trans_logs`, {
      method: "POST",
      data: payload
    });
  } catch {
    return null;
  }
}

export async function updateLog(id, payload) {
  if (!id) return Promise.resolve(null);
  try {
    return await jsonFetch(`${LOG_BASE}/trans_logs/${id}`, {
      method: "PUT",
      data: payload
    });
  } catch {
    return null;
  }
}

export async function multiTranslate({ text, targetLangs, model, source }) {
  return jsonFetch(`${TRANSLATE_API}/api/translate`, {
    method: "POST",
    data: { text, targetLangs, model, source }
  });
}
export async function ragTranslate({ text, targetLangs, model, source, categories }) {
  return jsonFetch(`${TRANSLATE_API}/api/translate-rag`, {
    method: "POST",
    data: { text, targetLangs, model, source, categories }
  });
}
// NOTE: Add your dictionary API functions here
export function fetchAllWords() {
  const DICT_API = import.meta.env.VITE_DICTIONARY_API;
  return jsonFetch(`${DICT_API}/api/vocabularies`);
}

export function createWord({ categories, translations }) {
  const DICT_API = import.meta.env.VITE_DICTIONARY_API;
  return jsonFetch(`${DICT_API}/api/add-vocabulary`, {
    method: "POST",
    data: {
      categories,
      translations
    }
  });
}

export function updateWord(id, { categories, translations }) {
  const DICT_API = import.meta.env.VITE_DICTIONARY_API;
  return jsonFetch(`${DICT_API}/api/update-vocabulary/${id}`, {
    method: "PUT",
    data: {
      categories,
      translations
    }
  });
}

export function deleteWordById(id) {
  const DICT_API = import.meta.env.VITE_DICTIONARY_API;
  return jsonFetch(`${DICT_API}/api/delete-vocabulary/${id}`, {
    method: "DELETE"
  });
}


export function getCategories() {
  const DICT_API = import.meta.env.VITE_DICTIONARY_API;
  return jsonFetch(`${DICT_API}/api/categories`);
}