import { saveBitcoinPricesBulk } from '~/server/database/dataBase'
import type { BitcoinPrice } from '~/server/types/bitcoin'

export default defineEventHandler(async () => {
    console.log('Starting historical data backfill...')

    const config = useRuntimeConfig()
    const coinId = 'bitcoin'
    const currency = 'usd'

    // Определяем период: от сейчас до года назад
    const to = Math.floor(Date.now() / 1000)
    const from = to - (365 * 24 * 60 * 60) // 365 дней назад

    const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`

    try {
        const response = await $fetch<{ prices: [number, number][] }>(apiUrl, {
            headers: {
                'x-cg-demo-api-key': config.public.coinGeckoApiKey
            }
        })

        if (!response.prices || response.prices.length === 0) {
            return { success: false, message: 'No historical data received from CoinGecko.' }
        }

        // Преобразуем ответ от API в наш формат BitcoinPrice[]
        const pricesToSave: BitcoinPrice[] = response.prices.map(p => ({
            timestamp: p[0],
            price: p[1],
            coinId,
            currency
        }))

        console.log(`Received ${pricesToSave.length} data points from CoinGecko. Saving to DB...`)

        // Используем нашу новую функцию для массового сохранения
        await saveBitcoinPricesBulk(pricesToSave)

        console.log('Backfill completed successfully.')

        return { success: true, message: `Successfully saved ${pricesToSave.length} historical price points.` }
    } catch (error: any) {
        console.error('Error during data backfill:', error)
        return { success: false, message: 'Failed to backfill data.', error: error.message }
    }
})
