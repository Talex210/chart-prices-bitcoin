import { CoinGeckoService } from '~/server/services/coingecko'
import { getBitcoinPrices, saveBitcoinPrice, saveBitcoinPricesBulk } from '~/server/database/dataBase'
import type { BitcoinPrice } from '~/server/types/bitcoin'

export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig()
    const apiKey = config.public.coinGeckoApiKey

    if (!apiKey) {
        console.warn('CoinGecko API key not set. Cron job disabled.')
        return
    }

    const coinGecko = new CoinGeckoService(apiKey)

    // Функция для заполнения исторических данных за последних 24 часа
    const backfillHourlyData = async () => {
        try {
            console.log('Fetching initial hourly data for last 24 hours...')

            // Получаем данные за последние 24 часа
            const endTime = Date.now();
            const startTime = endTime - 24 * 60 * 60 * 1000;

            const response = await coinGecko.getHistoricalRange(startTime, endTime)
            const pricesToSave: BitcoinPrice[] = response.prices.map(
                ([timestamp, price]) => ({
                    timestamp,
                    price,
                    currency: 'usd',
                    coinId: 'bitcoin'
                })
            )

            await saveBitcoinPricesBulk(pricesToSave)

            console.log(`Saved ${pricesToSave.length} initial data points`)
        } catch (error) {
            console.error('Error during initial data backfill:', error)
        }
    }

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

    // Проверяем наличие данных за последние 24 часа
    try {
        const endTime = Date.now()
        const startTime = endTime - 24 * 60 * 60 * 1000
        const existingData = await getBitcoinPrices(startTime, endTime, 'day')

        // Если данных недостаточно - загружаем исторические
        if (existingData.length < 24) {
            await backfillHourlyData()
        }
    } catch (error) {
        console.error('Error checking existing data:', error)
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
