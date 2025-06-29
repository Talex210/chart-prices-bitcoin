import type { BitcoinPrice } from '~/server/types/bitcoin'

export class AlphaVantageService {
    private readonly apiKey: string
    private readonly baseUrl = 'https://www.alphavantage.co'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    async getCurrentPrice(): Promise<BitcoinPrice> {
        const url = `${this.baseUrl}/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${this.apiKey}`
        const response = await fetch(url)
        const data = await response.json()

        const rate = data['Realtime Currency Exchange Rate']
        return {
            timestamp: new Date().getTime(),
            price: parseFloat(rate['5. Exchange Rate']),
            currency: 'usd',
            coinId: 'bitcoin',
            source: 'alphavantage',
        }
    }
}
