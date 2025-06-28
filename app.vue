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

        <!-- Элементы для выбора дат -->
        <div class="custom-period">
            <div class="date-inputs">
                <input
                    v-model="startDate"
                    type="datetime-local"
                    :max="endDate"
                >
                <input
                    v-model="endDate"
                    type="datetime-local"
                    :min="startDate"
                >
                <button
                    :disabled="!startDate || !endDate"
                    @click="applyCustomPeriod"
                >
                    Show selected period
                </button>
            </div>
        </div>
        <!-- Элементы для выбора дат -->

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
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from "vue"
    import type { BitcoinPrice } from "~/server/types/bitcoin"
    import LineChart from "~/components/LineChart.vue"

    type Period = 'day' | 'week' | 'month' | 'year' | 'custom'
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

    // Реактивные переменные
    const selectedPeriod = ref<Period>('day')
    const startDate = ref<string>('')
    const endDate = ref<string>('')

    // Устанавливаем начальные даты (последние 24 часа по умолчанию)
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Форматируем даты для input[type=datetime-local]
    startDate.value = formatDateForInput(yesterday)
    endDate.value = formatDateForInput(now)

    // Функция для форматирования даты в формат, понятный input[type=datetime-local]
    function formatDateForInput(date: Date): string {
        return date.toISOString().slice(0, 16)
    }

    // Функция для преобразования строки даты в timestamp
    function dateToTimestamp(dateString: string): number {
        return new Date(dateString).getTime()
    }

    // Функция для установки нового периода
    function setPeriod(period: Period) {
        selectedPeriod.value = period
        // Сбрасываем кастомный период при выборе стандартного
        if (period !== 'custom') {
            startDate.value = ''
            endDate.value = ''
        }
    }

    // Функция для применения кастомного периода
    function applyCustomPeriod() {
        if (!startDate.value || !endDate.value) return

        selectedPeriod.value = 'custom'
    }

    // Динамический URL для useFetch
    const apiUrl = computed(() => {
        if (selectedPeriod.value === 'custom') {
            const start = dateToTimestamp(startDate.value)
            const end = dateToTimestamp(endDate.value)
            return `/api/pricesFromBD?startTime=${start}&endTime=${end}`
        }
        return `/api/pricesFromBD?period=${selectedPeriod.value}`
    })

    // Запрашиваем данные
    const { data, pending, refresh } = useFetch<BitcoinPrice[]>(apiUrl, {
        watch: [apiUrl]
    })

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

/* Стили для кастомного периода */
.custom-period {
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
}

.date-inputs {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.date-inputs input {
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #333;
    background-color: #222;
    color: white;
    font-size: 14px;
}

.date-inputs button {
    margin: 0;
    padding: 8px 16px;
    background-color: #eabe0b;
    color: #000;
    font-weight: bold;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.date-inputs button:disabled {
    background-color: #666;
    cursor: not-allowed;
}
/* Стили для кастомного периода */
</style>
