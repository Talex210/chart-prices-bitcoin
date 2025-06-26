<template>
    <div>
        <h1>
            Bitcoin Price Chart
        </h1>

        <div class="period-buttons">
            <button
                v-for="p in periodButtons"
                :key="p.period"
                :class="{ active: selectedPeriod === p.period }"
                @click="setPeriod(p.period)"
            >
                {{ p.label }}
            </button>
        </div>


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
    import { ref, computed, watch } from "vue"
    import type { BitcoinPrice } from "~/server/types/bitcoin"
    import LineChart from "~/components/LineChart.vue"

    type Period = 'day' | 'week' | 'month' | 'year'
    interface PeriodButton {
        label: string
        period: Period
    }

    // Кнопки для выбора периода
    const periodButtons: PeriodButton[] = [
        { label: 'Day', period: 'day' },
        { label: 'Week', period: 'week' },
        { label: 'Month', period: 'month' },
        { label: 'Year', period: 'year' },
    ]

    // Реактивная переменная для хранения выбранного периода
    const selectedPeriod = ref<Period>('day')

    // Функция для установки нового периода
    function setPeriod(period: Period) {
        selectedPeriod.value = period
    }

    // Динамический URL для useFetch, который будет меняться при изменении selectedPeriod
    const apiUrl = computed(() => `/api/pricesFromBD?period=${selectedPeriod.value}`)

    // Запрашиваем данные из нашей базы данных с использованием динамического URL
    // useFetch автоматически сделает новый запрос при изменении apiUrl
    const { data, pending, error, refresh } = useFetch<BitcoinPrice[]>(apiUrl, {
        watch: [apiUrl] // Явно указываем следить за изменениями apiUrl
    })

    // Запрос на прямую с онлайн сервера
    // const { data, pending, error, refresh } = await coinGeckoRequest()

    // Запрашиваем данные из нашей базы данных
    // const { data, pending, error, refresh } = await useFetch<BitcoinPrice[]>('/api/pricesFromBD')

    watch(data, (currentData) => {
        console.log(`Data for period ${selectedPeriod.value}:`, currentData)
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
    margin: 1rem auto;
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

.period-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.period-buttons button {
    margin: 0;
    background-color: #333;
}

.period-buttons button.active {
    background-color: #eabe0b;
    color: #000;
    font-weight: bold;
}
</style>
