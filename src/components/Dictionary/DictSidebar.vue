<template>
  <div class="d-flex flex-column" style="height:100%">
    <v-card
      variant="outlined"
      class="mt-4 pa-4 d-flex flex-column"
      style="flex:1 1 auto; border: 1px solid rgba(0,0,0,0.12); height:100%;"
    >
      <!-- 🔍 Search + Add button -->
      <DictSearchBar
        :search="search"
        @update:search="$emit('update:search', $event)"
        @add="$emit('add')"
      />

      <!-- 🏷️ Category Filter -->
      <DictCategoryChips
        :categories="categories"
        :filter-cat="filterCat"
        @update:filter-cat="$emit('update:filterCat', $event)"
      />

      <v-divider class="mb-2" />

      <!-- 📋 Word list -->
      <DictWordList
        :items="items"
        :selected="selected"
        :locale="currentLocale"
        @select="$emit('select', $event)"
      />
    </v-card>
  </div>
</template>

<script>
import DictSearchBar from './Sidebar/DictSearchbar.vue';
import DictCategoryChips from './Sidebar/DictCategoryChips.vue';
import DictWordList from './Sidebar/DictWordList.vue';

export default {
  name: 'DictSidebar',
  components: { DictSearchBar, DictCategoryChips, DictWordList },
  props: {
    items: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
    search: { type: String, default: '' },
    filterCat: [String, Number],
    selected: Object
  },
  emits: ['update:search', 'update:filterCat', 'select', 'add'],
  computed: {
    currentLocale() {
      return this.$i18n.locale;
    }
  }
};
</script>
