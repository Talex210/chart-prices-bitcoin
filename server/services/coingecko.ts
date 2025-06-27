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

    async getHistoricalRange(
        startTime: number,
        endTime: number
    ): Promise<{ prices: [number, number][] }> {
        const url = `${this.baseUrl}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${Math.floor(startTime/1000)}&to=${Math.floor(endTime/1000)}&x_cg_demo_api_key=${this.apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        return response.json();
    }
}
