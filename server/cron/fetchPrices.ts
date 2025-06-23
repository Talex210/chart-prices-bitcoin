import { CoinGeckoService } from '~/server/services/coingecko'
import { saveBitcoinPrice } from '~/server/database/dataBase'

export default defineNitroPlugin(() => {
    const config = useRuntimeConfig()
    const apiKey = config.public.coinGeckoApiKey

    if (!apiKey) {
        console.warn('CoinGecko API key not set. Cron job disabled.')
        return
    }

    const coinGecko = new CoinGeckoService(apiKey)

    // Функция для выполнения обновления
    const fetchAndSave = async () => {
        try {
            const priceData = await coinGecko.getCurrentPrice()
            await saveBitcoinPrice(priceData)
            console.log(`[CRON] Price updated at ${new Date(priceData.timestamp).toISOString()}`)
        } catch (error) {
            console.error('[CRON] Error updating price:', error)
        }
    }

    // Выполнить сразу при запуске
    fetchAndSave()

    // Установить периодическое обновление
    const interval = setInterval(fetchAndSave, 60 * 60 * 1000); // Каждый час

    // Очистка при остановке
    useNitroApp().hooks.hook('close', () => {
        clearInterval(interval)
    })
})
