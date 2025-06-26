import { getBitcoinPrices } from '~/server/database/dataBase'

export default defineEventHandler(async (event) => {
    // Получаем параметры из запроса, если они есть
    const query = getQuery(event)
    const period = query.period || 'day' // По умолчанию 'day'

    const endTime = Date.now()
    let startTime: number

    // Устанавливаем временной диапазон в зависимости от параметра 'period'
    switch (period) {
        case 'week':
            startTime = endTime - 7 * 24 * 60 * 60 * 1000 // 7 дней назад
            break
        case 'month':
            startTime = endTime - 30 * 24 * 60 * 60 * 1000 // 30 дней назад
            break
        case 'year':
            startTime = endTime - 365 * 24 * 60 * 60 * 1000 // 365 дней назад
            break
        case 'day':
        default:
            startTime = endTime - 24 * 60 * 60 * 1000 // 24 часа назад
            break
    }

    try {
        const prices = await getBitcoinPrices(startTime, endTime)

        return prices
    }
    catch (error) {
        console.error('Error fetching prices from DB:', error)
        setResponseStatus(event, 500)
        return { error: 'Failed to fetch price data from database' }
    }
})
