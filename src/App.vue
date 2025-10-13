<template>
  <v-app>
    <v-toolbar color="primary" density="compact">
      <img width="40" height="40" :src="logo" />
      <v-toolbar-title>
        {{ $t('nav.appTitle') }} <small>- v0.5(20250911)</small>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn :active="activeComponent == 'Translate'" text @click="toggleComponent('Translate')">
          {{ $t('nav.translate') }}
        </v-btn>
        <v-btn :active="activeComponent == 'Vision'" text @click="toggleComponent('Vision')">
          {{ $t('nav.visionMode') }}
        </v-btn>

        <v-btn :active="activeComponent == 'Demo2'" text @click="toggleComponent('Demo2')">
          {{ $t('nav.dictionary') }}
        </v-btn>

        <!-- select for language as En / Vi / Zh  dropdown-->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props">
              <v-icon small class="pl-1">mdi-translate</v-icon>
              {{ selLang }}
              <v-icon small class="pl-1">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-show="selLang !== item" @click="changeLanguage(item)"
              v-for="(item, index) in ['Tiếng Việt', 'English', '中文']" :key="index" :value="index">
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

      </v-toolbar-items>
    </v-toolbar>
    <v-main>
      <keep-alive>
        <ChatUi v-if="activeComponent == 'ChatUi'"></ChatUi>
      </keep-alive>
      <!-- <keep-alive>
    <Translate v-if="activeComponent == 'Translate'"></Translate>
  </keep-alive> -->
      <keep-alive>
        <Demo v-if="activeComponent == 'Translate'"></Demo>
      </keep-alive>
      <!-- Dictionary component hidden by request -->
      <keep-alive>
        <Vision v-if="activeComponent == 'Vision'"></Vision>
      </keep-alive>
      <keep-alive>
        <RAG v-if="activeComponent == 'RAG'"></RAG>
      </keep-alive>
      <keep-alive>
        <Demo2 v-if="activeComponent == 'Demo2'"></Demo2>
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script>
import logo from '@/assets/logo.png'
import ChatUi from './components/ChatUi.vue'
import Translate from './components/translateV2.vue'
import RAG from './components/RAG.vue'
import Vision from './components/Vision.vue'
import Demo from './components/Demo.vue'
import Demo2 from './components/Demo2.vue'
export default {
  components: {
    ChatUi,
    Translate,
    RAG,
    Vision,
    Demo,
    Demo2
  },
  data() {
    return {
      selLang: 'Tiếng Việt',
      logo,
      activeComponent: 'Translate'
    }
  },
  methods: {
    toggleComponent(component) {
      this.activeComponent = component;
    },
    changeLanguage(item) {
      if (item === 'Tiếng Việt') {
        this.selLang = 'Tiếng Việt';
        this.$i18n.locale = 'vi';
      } else if (item === 'English') {
        this.selLang = 'English';
        this.$i18n.locale = 'en';
      } else if (item === '中文') {
        this.selLang = '中文';
        this.$i18n.locale = 'zh';
      }
      // set the language to local storage
      localStorage.setItem('lang', this.$i18n.locale);
    }
  },
  mounted() {
    // http://10.13.34.154:3001/llm?activemode=ChatUi
    const url = new URL(window.location.href);
    const activeMode = url.searchParams.get("activemode");
    if (activeMode) {
      console.log('activeMode', activeMode);
      this.activeComponent = activeMode;
    } else {
      // console.log('activeMode', 'default');
    }
    // get the language from local storage
    const lang = localStorage.getItem('lang');
    if (lang) {
      this.$i18n.locale = lang;
      if (lang === 'vi') {
        this.selLang = 'Tiếng Việt';
      } else if (lang === 'en') {
        this.selLang = 'English';
      } else if (lang === 'zh') {
        this.selLang = '中文';
      }
    }

  }
}

</script>
