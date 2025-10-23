<template>
  <v-row>
    <v-col v-for="lang in langs" :key="lang.code" cols="12" md="4">
      <v-text-field
        :label="$t(`dict.${lang.code}`) || lang.label"
        v-model="form[lang.code]"
        variant="outlined"
        density="default"
        hide-details
        clearable
        color="primary"
      />

      <v-textarea
        class="mt-2"
        :label="getDescLabel(lang.code)"
        v-model="form.desc[lang.code]"
        variant="outlined"
        auto-grow
        rows="2"
        hide-details
        color="primary"
      />

      <div
        v-if="lang.code === 'zh-tw' && form['zh-tw']"
        class="text-caption mt-1 text-blue"
      >
        <slot name="pinyin" :text="form['zh-tw']"></slot>
      </div>
    </v-col>

    <v-divider class="my-4" />

    <!-- Categories -->
    <v-col cols="12" md="6">
      <v-autocomplete
        v-model="form.cats"
        :items="catsOptions"
        item-value="id"
        item-title="name"
        multiple
        chips
        closable-chips
        :rules="[v => !!v.length || $t('dict.selectAtLeastOneCategory')]"
        :label="$t('dict.cats')"
        required
        color="primary"
      >
        <template #selection="{ item, index }">
          <v-chip
            v-if="index < 5"
            size="x-small"
            class="mr-1"
            color="primary"
            variant="elevated"
            :key="item.raw.id"
          >
            {{ item.raw.name }}
          </v-chip>
          <span v-else-if="index === 5" class="text-caption grey--text">
            +{{ form.cats.length - 5 }} {{ $t('dict.more') }}
          </span>
        </template>
      </v-autocomplete>
    </v-col>

    <v-col cols="12" md="6" class="d-flex flex-column justify-center">
      <v-alert
        v-if="!canSave"
        variant="tonal"
        type="info"
        density="comfortable"
      >
        {{ $t('dict.selectAtLeastOneCategory') }}
      </v-alert>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  form: Object,
  langs: Array,
  catsOptions: Array,
});

const { t } = useI18n();

const canSave = computed(() => {
  const hasLang = ['en', 'vi', 'zh-tw'].some(
    (k) => props.form[k] && props.form[k].trim(),
  );
  const hasCat = props.form.cats && props.form.cats.length > 0;
  return hasLang && hasCat;
});

function getDescLabel(langCode) {
  const descKeys = {
    en: 'dict.descEn',
    vi: 'dict.descVi',
    'zh-tw': 'dict.descTw',
  };
  return t(descKeys[langCode] || 'dict.description');
}
</script>
