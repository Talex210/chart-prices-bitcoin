// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxt/ui'],
  runtimeConfig: {
    public: {
      coinGeckoApiKey: process.env.COINGECKO_API_KEY || ''
    },
    // Добавляем переменные для БД (только на сервере)
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME
  },
  nitro: {
    plugins: [
      '~/server/initDataBase.ts',
      '~/server/cron/fetchPrices.ts'
    ]
  },
})
