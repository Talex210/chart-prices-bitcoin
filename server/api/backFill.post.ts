import { saveBitcoinPricesBulk } from '~/server/database/dataBase'
import type { BitcoinPrice } from '~/server/types/bitcoin'

// Вспомогательная функция для создания паузы между запросами, чтобы не превышать лимиты API
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default defineEventHandler(async () => {
    console.log('Starting historical data backfill from 2020...')

    const config = useRuntimeConfig()
    const coinId = 'bitcoin'
    const currency = 'usd'
    const source = 'coingecko'
    const startYear = 2020
    const currentYear = new Date().getFullYear()
    let totalSavedPoints = 0
    const failedYears: number[] = []

    // Из-за ограничения бесплатного API невозможно получить исторические данные

    // Цикл по каждому году, начиная с startYear до текущего года
    for (let year = startYear; year <= currentYear; year++) {
        try {
            console.log(`Fetching data for the year ${year}...`)

            // Определяем временной диапазон для текущего года в цикле
            const from = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000)

            // Для текущего года конечной датой будет сегодняшний день, для прошлых - 31 декабря
            const toDate = (year === currentYear) ? new Date() : new Date(`${year}-12-31T23:59:59Z`);
            const to = Math.floor(toDate.getTime() / 1000)

            // Предотвращаем запрос, если начальная дата находится в будущем
            if (from * 1000 > Date.now()) {
                console.log(`Skipping year ${year} as it is in the future.`);
                continue;
            }

            const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`

            const response = await $fetch<{ prices: [number, number][] }>(apiUrl, {
                headers: {
                    'x-cg-demo-api-key': config.public.coinGeckoApiKey
                }
            })

            if (!response.prices || response.prices.length === 0) {
                console.log(`No historical data received from CoinGecko for the year ${year}.`)
                continue; // Переходим к следующему году
            }

            // Преобразуем ответ от API в наш формат BitcoinPrice[]
            const pricesToSave: BitcoinPrice[] = response.prices.map(p => ({
                timestamp: p[0],
                price: p[1],
                coinId,
                currency,
                source,
            }))

            console.log(`Received ${pricesToSave.length} data points for ${year}. Saving to DB...`)

            await saveBitcoinPricesBulk(pricesToSave)

            totalSavedPoints += pricesToSave.length

            console.log(`Successfully saved data for ${year}.`)

        } catch (error: any) {
            console.error(`Error during data backfill for year ${year}:`, error.message)
            failedYears.push(year)
            // Проверяем, не связана ли ошибка с превышением лимита запросов (код 429)
            if (error.response && error.response.status === 429) {
                console.error('API rate limit hit. Stopping backfill process.')
                return { success: false, message: `Backfill stopped due to API rate limiting during year ${year}. Total points saved: ${totalSavedPoints}. Failed years: ${failedYears.join(', ')}`, error: 'Too Many Requests' }
            }
        }

        // Делаем небольшую паузу между запросами, чтобы избежать блокировки по лимиту запросов
        await sleep(2500); // Пауза 2.5 секунды
    }

    if (failedYears.length > 0) {
        console.log(`Backfill completed with some failures. Failed years: ${failedYears.join(', ')}`)
        return { success: false, message: `Successfully saved ${totalSavedPoints} historical price points, but failed to fetch data for years: ${failedYears.join(', ')}.` }
    } else {
        console.log('Backfill completed successfully.')
        return { success: true, message: `Successfully saved a total of ${totalSavedPoints} historical price points for all years.` }
    }
})
