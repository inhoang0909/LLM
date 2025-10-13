import { fetchAllWords, createWord, getCategories } from '@/utils/api.js';

export function useDictionaryApi() {
  async function apiGetCategories() {
    const res = await getCategories();
    return res?.categories || [];
  }

  async function apiGetAllWords() {
    const res = await fetchAllWords();
    return res?.data || [];
  }

  async function apiCreateWord(payload) {
    return await createWord(payload);
  }

  return { apiGetCategories, apiGetAllWords, apiCreateWord };
}
