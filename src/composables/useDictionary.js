import { ref, computed } from 'vue';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh-tw', label: '繁体中文' }
];

export function useDictionaryPage() {
  const API = import.meta.env.VITE_DICTIONARY_API;

  const words = ref([]);
  const categories = ref([]);
  const loadingWords = ref(false);
  const loadingCats = ref(false);
  const filterCat = ref('all');
  const search = ref('');
  const selected = ref(null);
  const addDialog = ref(false);
  const saving = ref(false);
  const snackbar = ref(false);
  const snackMsg = ref('');
  const edit = ref(false);

  const form = ref({
    en: '',
    vi: '',
    'zh-tw': '',
    desc: { en: '', vi: '', 'zh-tw': '' },
    cats: []
  });

  function resetForm() {
    form.value.en = '';
    form.value.vi = '';
    form.value['zh-tw'] = '';
    form.value.desc = { en: '', vi: '', 'zh-tw': '' };
    form.value.cats = [];
  }

  function notify(msg) {
    snackMsg.value = msg;
    snackbar.value = true;
    setTimeout(() => (snackbar.value = false), 2500);
  }

async function fetchCategories() {
  loadingCats.value = true;
  try {
    const res = await fetch(`${API}/api/categories`).then(r => r.json());
    categories.value = (res?.categories || []).map(c => ({
      id: Number(c.id),   
      name: c.name
    }));
  } catch {
    notify('Load categories failed');
  } finally {
    loadingCats.value = false;
  }
}


  const editMode = ref(false);
  const deleteLoading = ref(false);

  function openAdd() {
    resetForm();
    editMode.value = false;
    addDialog.value = true;
  }

  async function openEdit(word) {
    try {
      // Show loading state
      saving.value = true;
      
      // Fetch detailed word data from API
      const detailedWord = await getWordDetails(word.id);
      
      if (!detailedWord) {
        notify('Failed to load word details');
        return;
      }
      
      // Fill form with detailed data from API - use 'lang' not 'language'
      form.value = {
        en: detailedWord.translations.find(t => t.lang === 'en')?.text || '',
        vi: detailedWord.translations.find(t => t.lang === 'vi')?.text || '',
        'zh-tw': detailedWord.translations.find(t => t.lang === 'zh-tw')?.text || '',
        desc: {
          en: detailedWord.translations.find(t => t.lang === 'en')?.desc || '',
          vi: detailedWord.translations.find(t => t.lang === 'vi')?.desc || '',
          'zh-tw': detailedWord.translations.find(t => t.lang === 'zh-tw')?.desc || ''
        },
        cats: detailedWord.categories.map(c => Number(c.id))
      };
      
      // Update selected with detailed data
      selected.value = detailedWord;
      
      editMode.value = true;
      addDialog.value = true;
      
    } catch (error) {
      notify('Failed to load word details');
      console.error('Error loading word details:', error);
    } finally {
      saving.value = false;
    }
  }

  async function fetchWords() {
    loadingWords.value = true;
    try {
      const res = await fetch(`${API}/api/vocabularies`).then(r => r.json());
      words.value = res?.data || [];
      if (selected.value) {
        selected.value = words.value.find(w => w.id === selected.value.id) || null;
      }
    } catch {
      notify('Load words failed');
    } finally {
      loadingWords.value = false;
    }
  }

  const filteredWords = computed(() => {
    const term = search.value.trim().toLowerCase();
    return words.value
      .filter(w =>
        filterCat.value === 'all'
          ? true
          : (w.categories || []).some(c => c.id === filterCat.value)
      )
      .filter(w => {
        if (!term) return true;
        const blob = [
          ...(w.translations || []).map(t => t.text || ''),
          ...(w.translations || []).map(t => t.desc || ''),
          ...(w.categories || []).map(c => c.name || '')
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(term);
      })
      .sort((a, b) => a.id - b.id);
  });

  function selectWord(w) {
    selected.value = w;
  }

  const canSave = computed(() =>
    ['en', 'vi', 'zh-tw'].some(l => form.value[l] && form.value[l].trim())
  );

  async function saveWord() {
    if (!canSave.value) return;
    saving.value = true;
    try {
      const payload = {
        categories: form.value.cats,
        translations: LANGS.map(l => ({
          language: l.code,
          text: form.value[l.code]?.trim(),
          description: form.value.desc[l.code]?.trim()
        })).filter(t => t.text)
      };
      const res = await fetch(`${API}/api/add-vocabulary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
      if (!res?.success) throw new Error();
      notify('Saved');
      addDialog.value = false;
      await fetchWords();
    } catch {
      notify('Save failed');
    } finally {
      saving.value = false;
    }
  }

  async function updateWord() {
    if (!canSave.value || !selected.value) return;
    saving.value = true;
    try {
      const payload = {
        categories: form.value.cats,
        translations: LANGS.map(lang => ({
          language: lang.code,
          text: form.value[lang.code] || '',
          description: form.value.desc[lang.code] || ''
        })).filter(t => t.text.trim())
      };

      // Debug log to see what's being sent
      console.log('Update payload:', payload);

      const res = await fetch(`${API}/api/update-vocabulary/${selected.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());
      
      if (!res?.success) throw new Error();
      notify('Word updated');
      addDialog.value = false;
      await fetchWords();
    } catch (error) {
      notify('Update failed');
      console.error('Update error:', error);
    } finally {
      saving.value = false;
    }
  }
async function getWordDetails(id) {
    try {
      const res = await fetch(`${API}/api/vocabulary/${id}`).then(r => r.json());
      return res?.data || null;
    }
    catch {
      notify('Load word details failed');
      return null;
    }
  }

  async function deleteWord() {
    if (!selected.value) return;
    deleteLoading.value = true;
    try {
      const res = await fetch(`${API}/api/delete-vocabulary/${selected.value.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());
      
      if (!res?.success) throw new Error();
      notify('Word deleted');
      selected.value = null;
      addDialog.value = false;
      await fetchWords();
    } catch {
      notify('Delete failed');
    } finally {
      deleteLoading.value = false;
    }
  }
  async function handleBulkUpload(wordList) {
    if (!Array.isArray(wordList) || !wordList.length) {
      notify('No words to upload');
      return;
    }

    const catMap = Object.fromEntries(
      categories.value.map(c => [c.name.trim().toLowerCase(), c.id])
    );

    for (const word of wordList) {
      const cats = (Array.isArray(word.categories)
        ? word.categories
        : word.categories?.split(',')
      )
        ?.map(c => catMap[c.trim().toLowerCase()])
        .filter(Boolean);

      const payload = {
        categories: cats,
        translations: LANGS.map(l => ({
          language: l.code,
          text: word[l.code]?.trim(),
          description: word.desc?.[l.code]?.trim?.() || ''
        })).filter(t => t.text)
      };

      // Now API is defined and available
      await fetch(`${API}/api/add-vocabulary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    notify('Bulk upload completed');
    await fetchWords();
    addDialog.value = false;

  }
  return {
    LANGS,
    words,
    categories,
    loadingWords,
    loadingCats,
    filterCat,
    search,
    selected,
    filteredWords,
    addDialog,
    form,
    canSave,
    saving,
    deleteLoading,
    editMode,
    snackbar,
    snackMsg,
    // actions
    fetchWords,
    fetchCategories,
    selectWord,
    openAdd,
    openEdit,
    saveWord,
    updateWord,
    deleteWord,
    resetForm,
    notify,
    getWordDetails,
    handleBulkUpload
  };
}