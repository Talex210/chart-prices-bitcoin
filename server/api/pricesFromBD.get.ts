import { getBitcoinPrices } from '~/server/database/dataBase'

export default defineEventHandler(async (event) => {
    // Получаем параметры из запроса, если они есть
    const query = getQuery(event)

    // Цена аз последние 24 часа сделана.
    // Наверное, тут же сделаем за остальные периоды, но только эти периоды нужно будет записать в БД.
    // Сделать соответствующие кнопки в app.vue.

    // Устанавливаем временной диапазон.
    // Если параметры не переданы, по умолчанию берем данные за последние 24 часа.
    const endTime = query.endTime ? parseInt(query.endTime as string) : Date.now()
    const startTime = query.startTime ? parseInt(query.startTime as string) : endTime - 24 * 60 * 60 * 1000 // 24 часа назад

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
