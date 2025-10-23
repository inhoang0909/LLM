<template>
  <div class="mb-3 d-flex align-center">
    <!-- Ô tìm kiếm -->
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

    <!--  Nút thêm từ mới -->
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
</template>

<script>
export default {
  name: 'DictSearchBar',
  props: {
    search: { type: String, default: '' }
  },
  emits: ['update:search', 'add']
};
</script>
