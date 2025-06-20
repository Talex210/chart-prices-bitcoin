// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxt/ui'],
  runtimeConfig: {
    public: {
      coingeckoApiKey: process.env.COINGECKO_API_KEY || ''
    }
  }
})
