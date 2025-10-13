<template>
  <v-card min-height="280" variant="outlined" color="primary" elevation="20">
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-2">
        <v-btn-toggle
          divided
          variant="outlined"
          v-model="internalLang"
          mandatory
        >
          <v-btn
            v-for="lang in languages"
            :key="lang.langCode"
            :value="lang.langCode"
            color="primary"
            @click="$emit('change-lang', lang.langCode)"
          ><small><b>{{ lang.text[$i18n.locale] }}</b></small></v-btn>
        </v-btn-toggle>
      </div>

      <!-- Hidden copy holder -->
      <textarea
        id="outputHidden"
        ref="hiddenArea"
        :value="translationRaw"
        style="position:absolute;left:-9999px;top:-9999px;"
        readonly
      ></textarea>

      <div v-if="translationRaw && !isTransError" class="rounded pa-3" style="border:1px solid #ddd;">
        <div v-html="translationHtml"></div>
        <div class="d-flex justify-space-between pt-2">
          <div>
            <v-btn
              icon
              size="x-small"
              variant="outlined"
              :color="rateSel === 'dislike' ? 'orange':'orange-lighten-3'"
              class="mr-2"
              @click="$emit('rate', 'dislike')"
            ><v-icon>mdi-thumb-down</v-icon></v-btn>
            <v-btn
              icon
              size="x-small"
              variant="outlined"
              :color="rateSel === 'like' ? 'green':'green-lighten-3'"
              class="mr-2"
              @click="$emit('rate', 'like')"
            ><v-icon>mdi-thumb-up</v-icon></v-btn>
          </div>
          <div>
            <v-btn
              variant="outlined"
              size="x-small"
              icon
              color="primary"
              @click="$emit('copy')"
            ><v-icon left>mdi-content-copy</v-icon></v-btn>
            <v-btn
              v-if="currentLangCode !== 'vi'"
              class="ml-1"
              variant="outlined"
              size="x-small"
              icon
              color="primary"
              @click="$emit('speak')"
            ><v-icon left>mdi-volume-high</v-icon></v-btn>
          </div>
        </div>
      </div>
      <div v-else class="rounded pa-3" style="border:1px solid #ddd;">
        {{ $t('trans.waitingForUserInput') }}
      </div>

      <v-alert
        v-if="piyinOutput"
        variant="outlined"
        color="grey"
        class="mt-2 pa-1"
      >
        <small>{{ piyinOutput }}</small>
      </v-alert>

      <div v-if="enhancedTrans" class="mt-3">
        <v-divider class="my-2" />
        <v-alert type="info" variant="outlined" class="mb-2">
          <v-icon start>mdi-star</v-icon>{{ $t('trans.enhancedTranslation') }}
        </v-alert>
        <div v-html="enhancedTrans"></div>
        <v-btn
          size="small"
          color="primary"
          variant="outlined"
          class="mt-2"
          @click="$emit('apply-enhanced')"
        >{{ $t('trans.applyEnhanced') }}</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'TranslateOutput',
  props: {
    translationRaw: String,
    rateSel: String,
    isTransError: Boolean,
    languages: Array,
    currentLangCode: String,
    piyinOutput: String,
    enhancedTrans: String
  },
  emits: ['rate','copy','speak','change-lang','apply-enhanced'],
  data() {
    return { internalLang: this.currentLangCode };
  },
  watch: {
    currentLangCode(v){ this.internalLang = v; }
  },
  computed: {
    translationHtml() {
      return (this.translationRaw || '').replace(/\n/g,'<br>');
    }
  }
};
</script>