<template>
    <div>
        <h1>
            Bitcoin Price Chart (Last 24 Hours)
        </h1>

        <div v-if="pending">
            Loading chart...
        </div>

        <pre v-if="data && data.length > 0">
            <LineChart :data="data" />
        </pre>

        <div v-if="data && data.length === 0" class="info">
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
            <button @click="testSave">
                Test Save in Data Base
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { BitcoinPrice } from "~/server/types/bitcoin"
    import LineChart from "~/components/LineChart.vue"

    // Запрос на прямую с онлайн сервера
    // const { data, pending, error, refresh } = await coinGeckoRequest()

    // Запрашиваем данные из нашей базы данных
    const { data, pending, error, refresh } = await useFetch<BitcoinPrice[]>('/api/pricesFromBD')

    watch(data, (currentData) => {
        console.log('Data from BD:', currentData)
    }, {
        immediate: true,
        deep: true,
    })

    // Для ручного тестирования
    const testSave = async () => {
        const testData: BitcoinPrice = {
            // Генерируем случайное время в пределах последних 24 часов
            timestamp: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
            // Генерируем случайную цену для наглядности
            price: 107000 + (Math.random() - 0.5) * 2000,
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

<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #000000;
    color: #ffffff;
    display: flex;
    justify-content: center;
    padding: 2rem;
}

h1 {
    text-align: center;
    color: #eabe0b;
}

.info {
    text-align: center;
    margin-top: 2rem;
    color: #eabe0b;
}

button {
    display: block;
    margin: 2rem auto;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color: #ba18cc;
    color: white;
    border: none;
    border-radius: 5px;
    transition: background-color 0.2s;
}

button:hover {
    background-color: #9605a1;
}
</style>
