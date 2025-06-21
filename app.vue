<template>
    <div>
        <h1>Bitcoin Data</h1>

        <div v-if="pending">
            Loading...
        </div>

        <pre v-if="data">
            {{ data }}
        </pre>

        <div v-if="!data" class="warning">
            <p>API key not provided. Showing mock data.</p>
            <pre>{{ mockData }}</pre>
        </div>

        <div v-if="error">
            <p>Error: {{ error.message }}</p>
            <button @click="() => refresh">Refresh</button>
        </div>

        <div>
            <button @click="() => testSave">Test Save in Data Base</button>
        </div>
    </div>
<!--  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>-->
</template>

<script setup lang="ts">
    import type { BitcoinPrice } from "~/server/types/bitcoin"

    const { data, pending, error, refresh } = await coinGeckoRequest()

    // Для ручного тестирования
    const testSave = async () => {
        const testData: BitcoinPrice = {
            timestamp: Date.now(),
            price: 65000,
            currency: 'usd',
            coinId: 'bitcoin',
        }

        const { data } = await useFetch('/api/save-price', {
            method: 'POST',
            body: testData,
        })
    }

    // подумать, какие мне данные не нужны, и удалить их из моковых
    // то же вынести в отдельный компонент
    const mockData = [
        {
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "image": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
            "current_price": 106089,
            "market_cap": 2109261424316,
            "market_cap_rank": 1,
            "fully_diluted_valuation": 2109264713190,
            "total_volume": 21727764559,
            "high_24h": 106450,
            "low_24h": 104004,
            "price_change_24h": 1111.29,
            "price_change_percentage_24h": 1.05859,
            "market_cap_change_24h": 21414582836,
            "market_cap_change_percentage_24h": 1.02568,
            "circulating_supply": 19881306,
            "total_supply": 19881337,
            "max_supply": 21000000,
            "ath": 111814,
            "ath_change_percentage": -5.12611,
            "ath_date": "2025-05-22T18:41:28.492Z",
            "atl": 67.81,
            "atl_change_percentage": 156343.01735,
            "atl_date": "2013-07-06T00:00:00.000Z",
            "roi": null,
            "last_updated": "2025-06-20T10:46:51.549Z"
        }
    ]
</script>
