/**
 * @composable useLogin
 * 
 * Handles user login logic for the application.
 * - Manages username/password state, validation, and loading UI.
 * - Calls backend login API.
 * - Verifies user access permission from config.
 * - Emits `login-success` with user data if successful.
 */

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * @param {Function} emit - Emit function from component setup context (used to emit events upward)
 */
export function useLogin(emit) {
  const { t } = useI18n(); //  Internationalization helper for translations

  // Reactive states
  const credentials = ref({
    username: '', // User input for username
    password: ''  // User input for password
  });

  const showPassword = ref(false);     // Toggle password visibility
  const isLoading = ref(false);        // Loading spinner state
  const loginError = ref('');          // Error message shown under login form
  const accessDenied = ref(false);     // Show access denied alert
  const errors = ref({                 // Per-field error messages
    username: '',
    password: ''
  });

  // Validation rule definitions
  const rules = {
    required: value => !!value || t('login.required')
  };

  // Computed property: true only if both fields are filled
  const isFormValid = computed(() => {
    return credentials.value.username && credentials.value.password;
  });

  /**
   * Clear all error states before re-login attempt
   */
  function clearErrors() {
    errors.value.username = '';
    errors.value.password = '';
    loginError.value = '';
    accessDenied.value = false;
  }

  /**
   * Check if current page is requesting access to "Dictionary" mode
   * This allows redirect handling for Demo2 mode
   */
  function isRequestingDictionary() {
    const url = new URL(window.location.href);
    return url.searchParams.get("activemode") === 'Demo2';
  }

  /**
   * Handle the login process
   * 1.Validate input
   * 2.Call login API
   * 3. Fetch access control list (users with specific permissions)
   * 4. Check if logged-in user is allowed access
   * 5. Emit `login-success` event to parent component
   */
  async function handleLogin() {
    // Step 1: Basic form validation
    if (!isFormValid.value) return;

    // Step 2: Start loading + reset error states
    isLoading.value = true;
    loginError.value = '';
    accessDenied.value = false;

    try {
      // Step 3: Send login request
      const response = await fetch(
        import.meta.env.LOGIN_URL || 'http://gmo021.cansportsvg.com/api/global-user/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials.value.username,
            password: credentials.value.password
          })
        }
      );

      // Parse JSON response
      const data = await response.json();

      // Step 4: If login successful
      if (response.ok) {
        // Fetch access control config to determine user permissions
        const accessRes = await fetch(import.meta.env.VITE_ACCESS_CONFIG_URL);
        const accessConfig = await accessRes.json();

        // Find user entry from config file
        const matchedUser = accessConfig.users.find(
          u => u.username === credentials.value.username
        );

        //  If user not in access config, deny access
        if (!matchedUser) {
          loginError.value = t('login.accessDenied');
          isLoading.value = false;
          return;
        }

        // Determine whether this user can access Dictionary features
        const canAccessDictionary =
          matchedUser?.categories?.includes('HR') || false;

        // Combine backend + config user data
        const userData = {
          ...data,
          username: credentials.value.username,
          displayName:
            matchedUser?.displayName || data.name || credentials.value.username,
          categories: matchedUser?.categories || [],
          canAccessDictionary
        };

        // Step 5: Store tokens + user info locally
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', data.token || 'authenticated');

        // Step 6: Handle redirect logic for restricted pages
        if (!canAccessDictionary && isRequestingDictionary()) {
          // User is logged in but not authorized to access Dictionary
          accessDenied.value = true;

          // Delay redirect to show error first
          setTimeout(() => {
            emit('login-success', { ...userData, redirectTo: 'Translate' });
          }, 2000);
        } else {
          //  Normal success login flow
          emit('login-success', userData);
        }

      } else {
        //  Invalid credentials or backend error
        loginError.value = data.message || t('login.invalidCredentials');
      }

    } catch (error) {
      // Network / unexpected errors
      console.error('Login error:', error);
      loginError.value = t('login.networkError');

    } finally {
      // Step 7: Stop loading spinner
      isLoading.value = false;
    }
  }

  //  Return all reactive states + handlers for component usage
  return {
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
  };
}
