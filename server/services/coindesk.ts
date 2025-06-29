import type { BitcoinPrice } from '~/server/types/bitcoin'

export class CoinDeskService {
    private readonly apiKey: string
    private readonly baseUrl = 'https://data-api.coindesk.com/index/cc/v1'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    async getCurrentPrice(): Promise<BitcoinPrice> {
        const url = `${this.baseUrl}/latest/tick?market=ccix&instruments=BTC-USD&api_key=${this.apiKey}`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`CoinDesk API error: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()

        const data = responseData?.Data?.['BTC-USD']

        if (!data) {
            throw new Error('Invalid response structure from CoinDesk API. Instrument data not found.');
        }

        return {
            timestamp: data.VALUE_LAST_UPDATE_TS * 1000,
            price: data.VALUE,
            currency: 'usd',
            coinId: 'bitcoin',
            source: 'coindesk',
        }
    }
}
