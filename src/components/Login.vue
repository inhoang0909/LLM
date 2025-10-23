<template>
  <v-container fluid class="fill-height pa-0">
    <v-row class="fill-height" no-gutters>
      <v-col cols="12" class="d-flex align-center justify-center">
        <v-card
          class="pa-8"
          max-width="400"
          width="100%"
          elevation="8"
          rounded="lg"
        >
          <v-card-title class="text-center mb-6">
            <v-img
              :src="logo"
              max-width="60"
              class="mx-auto mb-4"
            />
            <h2 class="text-h4 font-weight-bold text-primary">
              {{ $t('login.title') }}
            </h2>
            <p class="text-subtitle-1 text-grey-darken-1 mt-2">
              {{ $t('login.subtitle') }}
            </p>
          </v-card-title>

          <v-form @submit.prevent="handleLogin" ref="loginForm">
            <v-text-field
              v-model="credentials.username"
              :label="$t('login.username')"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              :rules="[rules.required]"
              :error-messages="errors.username"
              class="mb-4"
              @input="clearErrors"
            />

            <v-text-field
              v-model="credentials.password"
              :label="$t('login.password')"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              :rules="[rules.required]"
              :error-messages="errors.password"
              class="mb-6"
              @input="clearErrors"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="isLoading"
              :disabled="!isFormValid"
              class="mb-4"
            >
              {{ $t('login.signIn') }}
            </v-btn>
          </v-form>

          <!-- Error Alert -->
          <v-alert
            v-if="loginError"
            type="error"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="loginError = ''"
          >
            {{ loginError }}
          </v-alert>

          <!-- Access Denied Alert -->
          <v-alert
            v-if="accessDenied"
            type="warning"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="accessDenied = false"
          >
            {{ $t('login.accessDenied') }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import logo from '@/assets/logo.png';
import { useLogin } from '@/composables/useLogin';
import { useSessionTimeout } from '@/composables/useSessionTimeout'; // <-- Add this

const emit = defineEmits(['login-success']);

const {
  credentials,
  showPassword,
  isLoading,
  loginError,
  accessDenied,
  errors,
  rules,
  isFormValid,
  clearErrors,
  handleLogin
} = useLogin(emit);

const loginForm = ref(null);

const { warningShown, onTimeout } = useSessionTimeout(15); 

onTimeout.value = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  emit('logout'); 
  alert('Session expired. Please log in again.');
};
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.fill-height {
  height: 100vh;
}
</style>