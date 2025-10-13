<template>
  <div class="d-flex flex-column" style="height:100%">
    <v-card
      variant="outlined"
      class="mt-4 pa-4 d-flex flex-column"
      style="flex:1 1 auto; border: 1px solid rgba(0, 0, 0, 0.12); height:100%;"
    >
      <!-- Fixed header section -->
      <div class="mb-3 d-flex align-center">
        <v-text-field
          density="comfortable"
          variant="outlined"
          rounded="pill"
          hide-details
          clearable
          :placeholder="$t('dict.searchPlaceholder')"
          :model-value="search"
          @update:model-value="$emit('update:search', $event)"
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1 mr-2"
        />

        <v-tooltip :text="$t('dict.newWord')">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              variant="elevated"
              size="default"
              rounded="pill"
              @click="$emit('add')"
            >
              <v-icon start>mdi-plus</v-icon>
              {{ $t('dict.newWord') }}
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Fixed categories section -->
      <v-slide-group show-arrows class="mb-3" center-actives style="overflow: visible;">
        <v-slide-group-item>
          <v-chip
            size="default"
            rounded="pill"
            :color="filterCat === 'all' ? 'primary' : 'grey-lighten-3'"
            :text-color="filterCat === 'all' ? 'white' : 'grey-darken-2'"
            variant="flat"
            class="mr-2"
            @click="$emit('update:filterCat', 'all')"
          >
            <v-icon start small>mdi-earth</v-icon>
            {{ $t('dict.catsAll') }}
          </v-chip>
        </v-slide-group-item>

        <v-slide-group-item v-for="c in categories" :key="c.id">
          <v-chip
            size="default"
            rounded="pill"
            class="mr-2"
            :color="filterCat === c.id ? 'primary' : 'grey-lighten-3'"
            :text-color="filterCat === c.id ? 'white' : 'grey-darken-2'"
            variant="flat"
            @click="$emit('update:filterCat', c.id)"
          >
            <v-icon start small>mdi-tag-outline</v-icon>
            {{ c.name }}
          </v-chip>
        </v-slide-group-item>
      </v-slide-group>

      <v-divider class="mb-2" />

      <!-- Scrollable list section -->
      <v-list
        density="comfortable"
        class="pa-0 flex-grow-1"
        style=" min-height: 0;"
      >
        <v-list-item
          v-for="w in items"
          :key="w.id"
          @click="$emit('select', w)"
          :active="selected && selected.id === w.id"
          rounded="xl"
          class="mb-2 hover:shadow-sm transition-all"
        >
          <v-list-item-title class="text-body-1 font-weight-medium">
            {{ mainText(w) }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-grey">
            {{ shortDesc(w) }}
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex flex-wrap">
              <v-chip
                v-for="c in w.categories"
                :key="c.id"
                size="default"
                class="ml-1 mb-1"
                color="secondary"
                variant="tonal"
                rounded="pill"
              >
                {{ c.name }}
              </v-chip>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'DictSidebar',
  props: {
    items: Array,
    categories: Array,
    search: String,
    filterCat: [String, Number],
    selected: Object
  },
  emits: ['update:search', 'update:filterCat', 'select', 'add'],
  computed: {
    currentLocale() {
      return this.$i18n.locale;
    },
    dataLangCode() {
      const localeMap = {
        'zh': 'zh-tw',     
        'zh-tw': 'zh-tw',  
        'en': 'en',
        'vi': 'vi'
      };
      return localeMap[this.currentLocale] || this.currentLocale;
    }
  },
  methods: {
    mainText(w) {
      const currentLang = w.translations?.find(t => t.lang === this.dataLangCode);
      if (currentLang?.text) {
        return currentLang.text;
      }
      
      const en = w.translations?.find(t => t.lang === 'en');
      if (en?.text) {
        return en.text;
      }
      
      return w.translations?.[0]?.text || this.$t('dict.noText', '(no text)');
    },
    shortDesc(w) {
      const currentLang = w.translations?.find(t => t.lang === this.dataLangCode);
      if (currentLang?.desc) {
        return currentLang.desc.slice(0, 70) + (currentLang.desc.length > 70 ? '…' : '');
      }
      
      const en = w.translations?.find(t => t.lang === 'en');
      if (en?.desc) {
        return en.desc.slice(0, 70) + (en.desc.length > 70 ? '…' : '');
      }
      
      return '';
    }
  }
};
</script>

<style scoped>
.hover\:shadow-sm:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.transition-all {
  transition: all 0.2s ease;
}

/* tuỳ chọn: làm scrollbar mảnh & đẹp hơn */
.v-list::-webkit-scrollbar {
  width: 6px;
}
.v-list::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.v-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.4);
}
</style>
