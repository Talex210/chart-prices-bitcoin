<template>
    <div>
        <h1>Bitcoin Data from Database</h1>

        <div v-if="pending">
            Loading...
        </div>

        <pre v-if="data && Array.isArray(data) && data.length">
            {{ data }}
        </pre>

        <div v-if="data && Array.isArray(data) && data.length === 0" class="info">
            <p>
                No data found in the database for the selected period.
            </p>
        </div>

        <div v-if="error">
            <p>
                Error: {{ error.message }}
            </p>

            <button @click="() => refresh">
                Refresh
            </button>
        </div>

        <div>
            <button @click="testSave">Test Save in Data Base</button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { BitcoinPrice } from "~/server/types/bitcoin"

    // Запрос на прямую с онлайн сервера
    // const { data, pending, error, refresh } = await coinGeckoRequest()

    // Запрашиваем данные из нашей базы данных
    const { data, pending, error, refresh } = await useFetch<BitcoinPrice[]>('/api/pricesFromBD')

    // Для ручного тестирования
    const testSave = async () => {
        const testData: BitcoinPrice = {
            timestamp: Date.now(),
            price: 65000,
            currency: 'usd',
            coinId: 'bitcoin',
        }

        await $fetch('/api/save-price', {
            method: 'POST',
            body: testData,
        })

        // После сохранения новых данных, обновляем список
        await refresh()
    }
</script>
