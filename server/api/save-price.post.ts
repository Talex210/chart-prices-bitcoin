import type { BitcoinPrice } from '~/server/types/bitcoin'
import { saveBitcoinPrice } from '~/server/database/dataBase'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const priceData: BitcoinPrice = {
        timestamp: body.timestamp,
        price: parseFloat(body.price),
        currency: body.currency,
        coinId: body.coinId
    }

    try {
        const saved = await saveBitcoinPrice(priceData)
        return { success: saved }
    } catch (error) {
        setResponseStatus(event, 500)
        return { error: 'Failed to save price data' }
    }
})
