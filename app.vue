<template>
    <div class="main-content">
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

        <div v-if="pending && Array.isArray(data) && !data.length" class="loading-container">
            Loading chart...
        </div>

        <div v-else-if="Array.isArray(data) && data.length" class="chart-wrapper">
            <LineChart :data="data" />

            <div v-if="pending" class="chart-overlay">
                <div class="loading-indicator">
                    Updating...
                </div>
            </div>
        </div>

        <div v-else class="info">
            <p>
                No data found for selected period
            </p>
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
    const { data, pending, refresh } = useFetch<BitcoinPrice[]>(apiUrl, {
        watch: [apiUrl] // Явно указываем следить за изменениями apiUrl
    })

    // Запрос на прямую с онлайн сервера
    // const { data, pending, error, refresh } = await coinGeckoRequest()

    watch(data, (currentData) => {
        console.log(`Data for period ${selectedPeriod.value}:`, currentData)
    }, {
        immediate: true,
        deep: true,
    })
</script>

<style>
.main-content {
    width: 100%;
    max-width: 95vw;
    margin: 0 auto;
    padding: 0 1rem;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    margin: 2rem 0;
    transition: opacity 0.3s ease;
}

.chart-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.loading-indicator {
    background: #eabe0b;
    color: #000;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: bold;
}

.loading-container {
    height: 500px; /* Фиксированная высота для сохранения пространства */
    display: flex;
    align-items: center;
    justify-content: center;
    color: #eabe0b;
    font-size: 1.2rem;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #000000;
    color: #ffffff;
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
    border: none;
    border-radius: 5px;
    transition: background-color 0.2s;
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

button:hover {
    background-color: rgba(234, 190, 11, 0.5);
}
</style>
