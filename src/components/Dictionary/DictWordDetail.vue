<template>
  <div 
    class="d-flex flex-column"
    :style="word ? 'height:100%' : 'height:auto; min-height:100px'"
  >
    <v-card
      v-if="word"
      variant="outlined"
      class="mt-4 pa-4"
      style="flex:1 1 auto; overflow:auto; border: 1px solid rgba(0, 0, 0, 0.12);"
    >
      <div class="d-flex justify-end mb-3">
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="$emit('edit', word)"
        >
          <v-icon start>mdi-pencil</v-icon>
          {{ $t('dict.updateWord') }}
        </v-btn>
      </div>

      <v-row dense>
        <v-col
          cols="12"
          md="4"
          v-for="t in safeTranslations"
          :key="t.lang"
        >
          <v-card variant="tonal" color="primary" class="pa-3 mb-3" >
            <v-text-field
              :label="$t(`dict.${t.lang}`) || labels[t.lang] || t.lang"
              :model-value="t.text"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
              append-inner-icon="mdi-content-copy"
              @click:append-inner="$emit('copy', t.text)"
            />
            <div v-if="t.lang === 'zh-tw' && t.text" class="text-caption mt-1 text-blue">
              {{ renderPinyin(t.text) }}
            </div>
            <v-textarea
              v-if="t.desc"
              class="mt-4 equal-text-area"
              :label="getDescLabel(t.lang)"
              :model-value="t.desc"
              readonly
              auto-grow
              rows="2"
              variant="outlined"
              hide-details
            />
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-alert
      v-else
      variant="outlined"
      color="primary"
      density="comfortable"
      class="mt-4"
    >
      {{ $t('dict.selectWordToView') }}
    </v-alert>
  </div>
</template>

<script>
import pinyin from 'pinyin';
export default {
  name: "DictWordDetail",
  props: {
    word: Object,
  },
  emits: ["copy", "edit"], 
  computed: {
    safeTranslations() {
      return (this.word?.translations || []).filter((t) => t && t.lang);
    },
    displayMain() {
      const en = this.safeTranslations.find((t) => t.lang === "en");
      return en?.text || this.safeTranslations[0]?.text || "";
    },
    mainDesc() {
      const en = this.safeTranslations.find((t) => t.lang === "en");
      return en?.desc || "";
    },
    labels() {
      return { 
        en: this.$t('dict.en'), 
        vi: this.$t('dict.vi'), 
        'zh-tw': this.$t('dict.tw') 
      };
    },
  },
  methods:{
    renderPinyin(text){
      if(!text) return '';
      let _fmt = pinyin(text,{
        segment: true,
        group: true,
      });
      return _fmt.join(' ');
    },
    getDescLabel(lang) {
      const descKeys = {
        'en': 'dict.descEn',
        'vi': 'dict.descVi', 
        'zh-tw': 'dict.descTw'
      };
      return this.$t(descKeys[lang] || `dict.desc${lang.toUpperCase()}`);
    }
  }
};
</script>
