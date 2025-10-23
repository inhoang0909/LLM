import { computed } from 'vue';

export function useUserCategories(words, categories) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userCategories = Array.isArray(user.categories) ? user.categories : [];

  const filteredCategories = computed(() => {
    if (!Array.isArray(categories.value)) return [];
    return categories.value.filter(cat => 
      userCategories.includes(cat.name)
    );
  });

  // Filter words to only show words in user's categories
  const filteredWords = computed(() => {
    if (!Array.isArray(words.value)) return [];
    return words.value.filter(word =>
      word.categories?.some(cat => userCategories.includes(cat.name))
    );
  });

  return {
    userCategories,
    filteredCategories,
    filteredWords
  };
}