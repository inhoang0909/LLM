<template>
  <v-list density="comfortable" class="pa-0 flex-grow-1" style="min-height: 0;">
    <v-list-item
      v-for="w in items"
      :key="w.id"
      @click="$emit('select', w)"
      :active="selected?.id === w.id"
      rounded="xl"
      class="mb-2 hover:shadow-sm transition-all"
    >
      <!--  Từ chính -->
      <v-list-item-title class="text-body-1 font-weight-medium">
        {{ getTranslationText(w) }}
      </v-list-item-title>

      <!-- Mô tả ngắn -->
      <v-list-item-subtitle class="text-caption text-grey">
        {{ getShortDesc(w) }}
      </v-list-item-subtitle>

      <!-- Danh mục -->
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
</template>

<script>
export default {
  name: 'DictWordList',
  props: {
    items: { type: Array, default: () => [] },
    selected: Object,
    locale: { type: String, default: 'en' }
  },
  emits: ['select'],

  computed: {
    dataLangCode() {
      //  Map locale → chuẩn langCode cho dữ liệu
      const map = { zh: 'zh-tw', 'zh-tw': 'zh-tw', en: 'en', vi: 'vi' };
      return map[this.locale] || this.locale;
    }
  },

  methods: {
    // Lấy translation phù hợp với ngôn ngữ hiển thị
    getTranslation(w, lang = this.dataLangCode) {
      return w.translations?.find(t => t.lang === lang);
    },

    // Text hiển thị chính (ưu tiên current locale → fallback English)
    getTranslationText(w) {
      const current = this.getTranslation(w);
      const fallback = this.getTranslation(w, 'en');
      return (
        current?.text ||
        fallback?.text ||
        w.translations?.[0]?.text ||
        this.$t('dict.noText')
      );
    },

    // 🧠 Mô tả ngắn gọn (rút gọn 70 ký tự)
    getShortDesc(w) {
      const current = this.getTranslation(w);
      const fallback = this.getTranslation(w, 'en');
      const desc = current?.desc || fallback?.desc;
      return desc ? desc.slice(0, 70) + (desc.length > 70 ? '…' : '') : '';
    }
  }
};
</script>

<style scoped>
.hover\:shadow-sm:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.transition-all {
  transition: all 0.2s ease;
}

/* ✨ Custom Scrollbar */
.v-list::-webkit-scrollbar {
  width: 6px;
}
.v-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.v-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}
</style>
