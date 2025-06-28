import { getBitcoinPrices } from '~/server/database/dataBase'

export default defineEventHandler(async (event) => {
    // Получаем параметры из запроса, если они есть
    const query = getQuery(event)

    // Если переданы startTime и endTime - используем их
    if (query.startTime && query.endTime) {
        try {
            const startTime = Number(query.startTime)
            const endTime = Number(query.endTime)

            // Для кастомного периода используем более детальные данные
            const prices = await getBitcoinPrices(startTime, endTime, 'day')

            return prices
        } catch (error) {
            console.error('Error fetching custom period prices:', error)
            setResponseStatus(event, 500)
            return { error: 'Failed to fetch custom period price data' }
        }
    }

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
        const prices = await getBitcoinPrices(startTime, endTime, period as string)

        return prices
    }
    catch (error) {
        console.error('Error fetching prices from DB:', error)
        setResponseStatus(event, 500)
        return { error: 'Failed to fetch price data from database' }
    }
})
