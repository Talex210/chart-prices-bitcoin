import type { CoinGeckoResponse, BitcoinPrice } from '~/server/types/bitcoin'

export  class CoinGeckoService {
    private readonly apiKey: string
    private readonly baseUrl = 'https://api.coingecko.com/api/v3'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    // Получение текущей цены
    async getCurrentPrice(): Promise<BitcoinPrice> {
        const url = `${this.baseUrl}/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=${this.apiKey}`
        const response = await fetch(url)
        const data: CoinGeckoResponse[] = await response.json()

        return this.transformResponse(data[0])
    }

    // Преобразование данных API в нашу структуру
    private transformResponse(data: CoinGeckoResponse): BitcoinPrice {
        return {
            timestamp: new Date(data.last_updated).getTime(),
            price: data.current_price,
            currency: 'usd',
            coinId: data.id,
        }
    }

    // Получение исторических данных
    // нужно проверить работоспособность
    // скорей всего пригодиться, для того чтобы вызывать любой период
    async getHistoricalPrices(days = 30): Promise<BitcoinPrice[]> {
        const url = `${this.baseUrl}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${this.apiKey}`
        const response = await fetch(url)
        const data = await response.json()

        return data.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp,
            price,
            currency: 'usd',
            coinId: 'bitcoin',
        }))
    }
}
