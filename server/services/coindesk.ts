import type { BitcoinPrice } from '~/server/types/bitcoin'

export class CoinDeskService {
    private readonly baseUrl = 'https://api.coindesk.com/v1'

    async getCurrentPrice(): Promise<BitcoinPrice> {
        const url = `${this.baseUrl}/v1/bpi/currentprice.json`
        const response = await fetch(url)
        const data = await response.json()

        return {
            timestamp: new Date(data.time.updatedISO).getTime(),
            price: data.bpi.USD.rate_float,
            currency: 'usd',
            coinId: 'bitcoin',
            source: 'coindesk',
        }
    }
}
