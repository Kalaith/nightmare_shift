import axios from 'axios';
import { getActiveToken, persistLoginUrl } from '../auth/storage';

// Determine the base URL from the environment or use a relative path
const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) {
    throw new Error('VITE_API_URL environment variable is not set. Please add it to your .env file.');
}

/**
 * Standardized Web Hatchery Axios Instance
 * Automatically handles Bearer tokens and 401 Unauthorized redirects.
 */
export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
    (config) => {
        // We intentionally interact directly with localStorage here to avoid
        // reactivity issues or circular dependencies when initializing Axios outside of React.
        try {
            const token = getActiveToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to parse auth token from local storage', error);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401s and standardize errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Intercept 401 Unauthorized and redirect to central login
        if (error.response?.status === 401) {
            const loginUrl =
                error.response?.data?.login_url ||
                import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL;

            if (loginUrl) {
                try {
                    persistLoginUrl(loginUrl);
                    window.dispatchEvent(new CustomEvent('webhatchery:login-required', { detail: { loginUrl } }));
                } catch (storageError) {
                    console.warn('Failed to persist login URL to auth storage', storageError);
                }
            }
        }
        return Promise.reject(error);
    }
);
