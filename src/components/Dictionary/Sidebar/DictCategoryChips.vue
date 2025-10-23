<template>
  <!-- 🏷️ Category chips -->
  <v-slide-group show-arrows class="mb-3" center-actives style="overflow: visible;">
    <template v-for="cat in categoryChips" :key="cat.id">
      <v-slide-group-item>
        <v-chip
          size="default"
          rounded="pill"
          class="mr-2"
          :color="cat.isActive ? 'primary' : 'grey-lighten-3'"
          :text-color="cat.isActive ? 'white' : 'grey-darken-2'"
          variant="flat"
          @click="$emit('update:filterCat', cat.id)"
        >
          <v-icon start small>{{ cat.icon }}</v-icon>
          {{ cat.label }}
        </v-chip>
      </v-slide-group-item>
    </template>
  </v-slide-group>
</template>

<script>
export default {
  name: 'DictCategoryChips',
  props: {
    categories: { type: Array, default: () => [] },
    filterCat: [String, Number]
  },
  emits: ['update:filterCat'],
  computed: {
    categoryChips() {
      return [
        {
          id: 'all',
          label: this.$t('dict.catsAll'),
          icon: 'mdi-earth',
          isActive: this.filterCat === 'all'
        },
        ...this.categories.map(c => ({
          id: c.id,
          label: c.name,
          icon: 'mdi-tag-outline',
          isActive: this.filterCat === c.id
        }))
      ];
    }
  }
};
</script>
