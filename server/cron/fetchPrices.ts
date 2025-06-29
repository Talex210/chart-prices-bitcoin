import { CoinGeckoService } from '~/server/services/coingecko'
import { AlphaVantageService } from '~/server/services/alphavantage'
import { CoinDeskService } from '~/server/services/coindesk'
import { getBitcoinPrices, saveBitcoinPrice, saveBitcoinPricesBulk } from '~/server/database/dataBase'
import type { BitcoinPrice } from '~/server/types/bitcoin'

export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig();
    const sources = {
        coingecko: new CoinGeckoService(config.public.coinGeckoApiKey),
        alphavantage: new AlphaVantageService(config.public.alphaVantageApiKey),
        coindesk: new CoinDeskService()
    }

    // Функция для обновления и сохранения данных для одного источника
    const fetchAndSaveForSource = async (sourceKey: keyof typeof sources) => {
        try {
            const service = sources[sourceKey]
            const priceData = await service.getCurrentPrice()
            await saveBitcoinPrice(priceData)
            console.log(`[${sourceKey}] Price updated at ${new Date(priceData.timestamp).toISOString()}`)
        } catch (error) {
            console.error(`[${sourceKey}] Error updating price:`, error)
        }
    }

    // Функция для заполнения исторических данных за последних 24 часа для CoinGecko
    const backfillHourlyDataForCoinGecko = async () => {
        try {
            console.log('Fetching initial hourly data for last 24 hours from CoinGecko...')
            const endTime = Date.now()
            const startTime = endTime - 24 * 60 * 60 * 1000

            // Используем CoinGecko для получения исторических данных
            const response = await sources.coingecko.getHistoricalRange(startTime, endTime)
            const pricesToSave: BitcoinPrice[] = response.prices.map(
                ([timestamp, price]) => ({
                    timestamp,
                    price,
                    currency: 'usd',
                    coinId: 'bitcoin',
                    source: 'coingecko',
                })
            )

            await saveBitcoinPricesBulk(pricesToSave)
            console.log(`Saved ${pricesToSave.length} initial data points for CoinGecko`)
        } catch (error) {
            console.error('Error during initial data backfill for CoinGecko:', error)
        }
    }

    // Проверяем наличие данных за последние 24 часа для CoinGecko
    // (мы пока делаем backfill только для CoinGecko, поэтому проверяем его)
    try {
        const endTime = Date.now()
        const startTime = endTime - 24 * 60 * 60 * 1000
        const existingData = await getBitcoinPrices(startTime, endTime, 'day', 'coingecko')

        // Если данных недостаточно - загружаем исторические
        if (existingData.length < 24) {
            await backfillHourlyDataForCoinGecko()
        }
    } catch (error) {
        console.error('Error checking existing data for CoinGecko:', error)
    }

    // Запускаем немедленное обновление для каждого источника
    Object.keys(sources).forEach(source => {
        // Запускаем сразу
        fetchAndSaveForSource(source as keyof typeof sources)
        // Устанавливаем периодическое обновление каждый час
        setInterval(() => fetchAndSaveForSource(source as keyof typeof sources), 60 * 60 * 1000)
    })

    // Очистка при остановке
    useNitroApp().hooks.hook('close', () => {
    })
})
