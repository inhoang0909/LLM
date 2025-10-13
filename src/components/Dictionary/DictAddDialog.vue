<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1080"
    persistent
  >
    <v-card elevation="2" rounded="lg" class="pa-4" color="grey-lighten-5">
      <!-- Title -->
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-bold text-primary">
          {{ editMode ? $t('dict.updateWord') : $t('dict.saveNewWord') }}
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="grey-darken-1"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider class="my-2" />

      <!-- Form -->
      <v-card-text>
        <v-row>
          <v-col v-for="lang in langs" :key="lang.code" cols="12" md="4">
            <v-text-field
              :label="$t(`dict.${lang.code}`) || lang.label"
              v-model="form[lang.code]"
              variant="outlined"
              density="comfortable"
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
        </v-row>

        <v-divider class="my-4" />

        <!-- Categories & Warning -->
        <v-row>
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
                  size="x-small"
                  class="mr-1"
                  color="primary"
                  variant="elevated"
                  :key="item.raw.id"
                  v-if="index < 5"
                >
                  {{ item.raw.name }}
                </v-chip>
                <span
                  v-else-if="index === 5"
                  class="text-caption grey--text"
                >
                  +{{ form.cats.length - 5 }} {{ $t('dict.more') }}
                </span>
              </template>
            </v-autocomplete>
          </v-col>

          <v-col cols="12" md="6" class="d-flex flex-column justify-center">
            <v-alert
              variant="tonal"
              type="info"
              density="comfortable"
              v-if="!canSave"
            >
              {{ $t('dict.enterAtLeastOneLangAndCategory') }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="justify-end mt-2">
        <v-btn variant="text" color="grey-darken-1" @click="$emit('reset')">
          {{ $t('dict.reset') }}
        </v-btn>

        <v-btn
          v-if="editMode"
          color="red-darken-2"
          variant="outlined"
          :disabled="saving"
          @click="$emit('delete')"
        >
          <v-icon start>mdi-delete</v-icon>
          {{ $t('dict.deleteWord') }}
        </v-btn>

        <v-btn
          :color="editMode ? 'orange-darken-2' : 'green-darken-2'"
          variant="elevated"
          :disabled="!canSave || saving"
          :loading="saving"
          @click="editMode ? $emit('update') : $emit('save')"
        >
          {{ editMode ? $t('dict.updateWord') : $t('dict.saveNewWord') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DictAddDialog',
  props: {
    modelValue: Boolean,
    form: Object,
    catsOptions: Array,
    saving: Boolean,
    deleteLoading: Boolean,
    editMode: Boolean,
    langs: Array,
  },
  emits: [
    'update:modelValue',
    'save',
    'update',
    'delete',
    'reset',
    'autoFill',
    'fillDesc',
  ],
  computed: {
    canSave() {
      const hasLang = ['en', 'vi', 'zh-tw'].some(
        (k) => this.form[k] && this.form[k].trim()
      );
      const hasCat = this.form.cats && this.form.cats.length > 0;
      return hasLang && hasCat;
    },
    hasAnyDesc() {
      return Object.values(this.form.desc).some((v) => v && v.trim());
    },
    selectedCatObjs() {
      const selectedIds = (this.form.cats || []).map(String);
      return (this.catsOptions || []).filter((c) =>
        selectedIds.includes(String(c.id))
      );
    },
  },
  methods: {
    getDescLabel(langCode) {
      const descKeys = {
        'en': 'dict.descEn',
        'vi': 'dict.descVi', 
        'zh-tw': 'dict.descTw',
        'cn': 'dict.descCn'
      };
      return this.$t(descKeys[langCode] || `dict.desc${langCode.toUpperCase()}`);
    }
  }
};
</script>

<style scoped>
.v-dialog .v-card {
  background-color: #fafafa;
  border-radius: 12px;
}

.v-card-title {
  padding-bottom: 0;
}

.v-card-actions {
  padding-top: 0;
}

.v-alert {
  border-left: 4px solid var(--v-theme-primary);
}
</style>
