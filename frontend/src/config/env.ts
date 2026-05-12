const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${name} environment variable is not set.`);
  }

  return value;
};

export const env = {
  apiUrl: requireEnv('VITE_API_URL', import.meta.env.VITE_API_URL),
  webHatcheryLoginUrl: requireEnv(
    'VITE_WEB_HATCHERY_LOGIN_URL',
    import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL
  ),
};
