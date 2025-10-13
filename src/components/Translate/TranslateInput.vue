<template>
  <v-card min-height="280" variant="outlined" color="indigo" elevation="20">
    <v-card-text>
      <v-row class="align-center mb-2" no-gutters>
        <v-col cols="12" sm="8" class="d-flex flex-column">
          <v-btn-toggle
            v-model="localQuality"
            mandatory
            variant="outlined"
            @update:model-value="emitQuality"
            class="flex-wrap"
          >
            <v-btn value="fast" size="small">{{ $t('trans.fastSpeed') }}</v-btn>
            <v-btn value="normal" size="small">{{ $t('trans.normal') }}</v-btn>
            <v-btn value="high" size="small">{{ $t('trans.highQuality') }}</v-btn>
          </v-btn-toggle>
          <small class="text-grey">{{ modeDescription }}</small>
        </v-col>

        <v-col class="d-flex justify-end mb-3">
          <v-btn
            :loading="isTranslating"
            variant="outlined"
            color="red"
            prepend-icon="mdi-translate"
            @click="$emit('translate')"
          >
            {{ $t('trans.translate') }}
          </v-btn>
        </v-col>
      </v-row>

      <!-- Categories Selection -->
    <v-row class="mb-3">
  <v-col cols="12">
    <div class="d-flex flex-wrap" style="gap: 12px;">
      <v-checkbox
        v-for="cat in categories"
        :key="cat.id"
        v-model="localCategories"
        :value="cat.id"
        :label="cat.name"
        density="compact"
        hide-details
        @change="emitCategories(localCategories)"
      />
    </div>
  </v-col>
</v-row>

      <div v-if="isVisionModel" class="mb-3">
        <v-alert type="info" variant="outlined" class="mb-2">
          <v-icon start>mdi-eye</v-icon>{{ $t('trans.visionMode') }}
        </v-alert>

        <v-row class="mb-2" style="gap: 8px;" no-gutters>
          <v-col cols="12" sm="auto">
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-upload"
              :loading="isExtractingText"
              @click="$emit('trigger-image')"
              class="w-100"
            >
              {{ $t('trans.uploadImage') }}
            </v-btn>
          </v-col>

          <v-col v-if="uploadedImage" cols="12" sm="auto">
            <v-btn
              variant="outlined"
              size="small"
              color="red"
              prepend-icon="mdi-delete"
              @click="$emit('clear-image')"
              class="w-100"
            >
              {{ $t('trans.clearImage') }}
            </v-btn>
          </v-col>

          <v-col v-if="uploadedImage" cols="12" sm="auto" class="d-flex align-center">
            <v-chip color="success" size="small">
              {{ $t('trans.imageReady') }}
            </v-chip>
          </v-col>
        </v-row>

        <v-img
          v-if="uploadedImage"
          :src="uploadedImage"
          max-height="200"
          class="mb-2 rounded w-100"
          contain
        />
      </div>

      <!-- Textarea -->
      <v-textarea
        v-model="localText"
        clearable
        :placeholder="$t('trans.sourceTransPlaceholder')"
        hide-details
        auto-grow
        variant="outlined"
        @update:model-value="emitText"
        class="w-100"
      />

      <code class="text-caption d-block mt-2">{{ currentModel }}</code>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'TranslateInput',
  props: {
    selectedQuality: String,
    modelsLoading: Boolean,
    inputText: String,
    isVisionModel: Boolean,
    uploadedImage: String,
    isExtractingText: Boolean,
    isTranslating: Boolean,
    currentModel: String,
    categories: Array, // Add categories prop
    selectedCategories: Array // Add selected categories prop
  },
  emits: [
    'update:quality',
    'update:text',
    'update:categories', // Add categories emit
    'translate',
    'fetch-models',
    'trigger-image',
    'clear-image'
  ],
  data() {
    return {
      localQuality: this.selectedQuality,
      localText: this.inputText,
      localCategories: this.selectedCategories || [] // Add local categories
    };
  },
  watch: {
    selectedQuality(v) { this.localQuality = v; },
    inputText(v) { this.localText = v; },
    selectedCategories(v) { this.localCategories = v || []; } // Watch selected categories
  },
  computed: {
    modeDescription() {
      const m = {
        fast: this.$t('trans.fastSpeedDesc'),
        normal: this.$t('trans.normalDesc'),
        high: this.$t('trans.highQualityDesc')
      };
      return m[this.localQuality] || '';
    }
  },
  methods: {
    emitQuality(v) { this.$emit('update:quality', v); },
    emitText(v) { this.$emit('update:text', v); },
    emitCategories(v) { this.$emit('update:categories', v); } 
  }
};
</script>