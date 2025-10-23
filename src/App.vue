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
        <v-menu v-if="isAuthenticated" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" text class="d-flex align-center">
              <v-icon small class="pr-1">mdi-account</v-icon>
              <span class="font-weight-medium">
                {{ user?.displayName || user?.username || 'User' }}
              </span>
              <v-icon small class="pl-1">mdi-menu-down</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item disabled>
              <v-list-item-title class="text-caption">
               {{$t('nav.dept')}}:{{ user?.dept || 'Logged in' }}
              </v-list-item-title>
            </v-list-item>

            <v-divider></v-divider>
            <v-list-item @click="logout" class="logout-item">
              <v-list-item-content class="d-flex align-center">
                <v-icon small color="red" class="mr-2">mdi-logout</v-icon>
                <v-list-item-title class="text-red">{{ $t('nav.logout') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>

      </v-toolbar-items>
    </v-toolbar>

    <v-main>
      <keep-alive>
        <ChatUi v-if="activeComponent == 'ChatUi'" />
      </keep-alive>
      <keep-alive>
        <Demo v-if="activeComponent == 'Translate'" />
      </keep-alive>
      <keep-alive>
        <Vision v-if="activeComponent == 'Vision'" />
      </keep-alive>
      <keep-alive>
        <RAG v-if="activeComponent == 'RAG'" />
      </keep-alive>

      <!-- Nếu Demo2 chưa login thì hiện form login, nếu login rồi thì vào Demo2 -->
      <keep-alive>
        <template v-if="activeComponent == 'Demo2'">
          <Login v-if="!isAuthenticated" @login-success="handleLoginSuccess" />
          <Demo2 v-else />
        </template>
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
import Login from './components/Login.vue'
import { useDifyChatbot } from './composables/useDifyChatbot'
export default {
  components: {
    ChatUi,
    Translate,
    RAG,
    Vision,
    Demo,
    Demo2,
    Login
  },
  setup()
  {
    useDifyChatbot();
    return {};
  },
  data() {
    return {
      selLang: 'Tiếng Việt',
      logo,
      activeComponent: 'Translate',
      isAuthenticated: false,
      user: null
    }
  },
  methods: {
    toggleComponent(component) {
      // Check if switching to Demo2 and not authenticated
      if (component === 'Demo2' && !this.isAuthenticated) {
        this.activeComponent = component;
        return;
      }
      this.activeComponent = component;
    },
    handleLoginSuccess(userData) {
      this.isAuthenticated = true;
      this.user = userData;

      // Redirect if specified
      if (userData.redirectTo) {
        this.activeComponent = userData.redirectTo;
      }
    },
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      // Redirect to translate page after logout
      this.activeComponent = 'Translate';
    },
    checkAuthentication() {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      if (user && token) {
        this.isAuthenticated = true;
        this.user = JSON.parse(user);
      }
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
    // Check authentication status first
    this.checkAuthentication();

    // http://10.13.34.154:3001/llm?activemode=ChatUi
    const url = new URL(window.location.href);
    const activeMode = url.searchParams.get("activemode");
    if (activeMode) {
      console.log('activeMode', activeMode);
      this.activeComponent = activeMode;
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
