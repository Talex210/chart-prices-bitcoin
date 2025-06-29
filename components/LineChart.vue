<template>
    <div ref="chartContainer" class="chart-container">
        <svg ref="svgRef" />
        <div ref="tooltipRef" class="tooltip" style="opacity: 0; position: absolute; pointer-events: none;" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type PropType } from 'vue'
import * as d3 from 'd3'
import type { BitcoinPrice } from '~/server/types/bitcoin'

const props = defineProps({
    data: {
        type: Array as PropType<BitcoinPrice[]>,
        required: true
    }
})

// --- Refs для DOM-элементов ---
const svgRef = ref<SVGSVGElement | null>(null)
const chartContainer = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

// --- Переменные для хранения D3-селекторов и шкал ---
let svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let x: d3.ScaleTime<number, number> | null = null
let y: d3.ScaleLinear<number, number> | null = null
let linePath: d3.Selection<SVGPathElement, unknown, null, undefined> | null = null
let areaPath: d3.Selection<SVGPathElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

// --- Функция инициализации графика (выполняется 1 раз) ---
const initChart = () => {
    if (!svgRef.value || !chartContainer.value) return

    const containerWidth = chartContainer.value.clientWidth
    const containerHeight = Math.min(containerWidth * 0.5625, window.innerHeight * 0.7)
    const margin = { top: 20, right: 10, bottom: 70, left: 70 }

    // 1. Создаем основной SVG и группу 'g'
    svg = d3.select(svgRef.value)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

// 2. Создаем defs
    const defs = svg.append('defs')

// 3. Добавляем градиент
    const gradient = defs.append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(234, 190, 11, 0.4)')
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(234, 190, 11, 0)')

// 4. Добавляем clipPath внутрь defs
    defs.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)

// 5. Добавляем оси и сетку
    svg.append('g').attr('class', 'grid y-grid')
    svg.append('g').attr('class', 'grid x-grid')
    svg.append('g').attr('class', 'x-axis')
    svg.append('g').attr('class', 'y-axis')

// 6. Только теперь создаём path-элементы
    areaPath = svg.append('path')
        .attr('fill', 'url(#area-gradient)')
        .attr('clip-path', 'url(#clip)')

    linePath = svg.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#eabe0b')
        .attr('stroke-width', 2)

    // 7 Первоначальный вызов функции обновления
    updateChart()
}

// --- Функция обновления графика (выполняется при изменении данных или размера) ---
const updateChart = () => {
    if (!svgRef.value || !chartContainer.value || !props.data || props.data.length === 0 || !svg) {
        return
    }

    // --- Размеры ---
    const containerWidth = chartContainer.value.clientWidth
    const containerHeight = Math.min(containerWidth * 0.5625, window.innerHeight * 0.7)
    const margin = { top: 20, right: 10, bottom: 70, left: 70 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    svg.select('#clip rect')
        .attr('height', height)
        .attr('y', 0)
        .transition()
        .duration(1500)
        .attr('width', width)

    d3.select(svgRef.value).attr('width', containerWidth).attr('height', containerHeight)
    svg.attr('transform', `translate(${margin.left},${margin.top})`)

    // --- Парсинг данных ---
    const parsedData = props.data.map(d => ({
        timestamp: new Date(+d.timestamp),
        price: +d.price
    }))

    // --- Обновление шкал ---
    x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp) as [Date, Date])
        .range([0, width])

    y = d3.scaleLinear()
        .domain([
            d3.min(parsedData, d => d.price) as number * 0.99,
            d3.max(parsedData, d => d.price) as number * 1.01
        ])
        .range([height, 0])
        .nice()

    // --- Анимация осей и сетки ---
    const transitionDuration = 1500 // Длительность анимации в мс
    const t = d3.transition().duration(transitionDuration)

    const xAxis = d3.axisBottom(x)
        .ticks(containerWidth > 600 ? 10 : 5)
        .tickFormat(d3.timeFormat(containerWidth > 600 ? '%b %d, %H:%M' : '%H:%M') as any)

    svg.select('.x-axis')
        .attr('transform', `translate(0,${height})`)
        .transition(t)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')

    svg.select('.y-axis')
        .transition(t)
        .call(d3.axisLeft(y).tickFormat(d => `$ ${d3.format(',.0f')(d)}`))

    svg.select('.x-grid')
        .attr('transform', `translate(0,${height})`)
        .transition(t)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ''))

    svg.select('.y-grid')
        .transition(t)
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''))

    // --- Генераторы области и линии ---
    const area = d3.area<{timestamp: Date, price: number}>()
        .x(d => x!(d.timestamp))
        .y0(height)
        .y1(d => y!(d.price))
        .curve(d3.curveMonotoneX)

    const line = d3.line<{timestamp: Date, price: number}>()
        .x(d => x!(d.timestamp))
        .y(d => y!(d.price))
        .curve(d3.curveMonotoneX)

    // --- Анимация пути для области и линии ---
    areaPath!
        .datum(parsedData)
        .transition(t)
        .attr('d', area)

    linePath!
        .datum(parsedData)
        .attr('d', line) // сначала обновляем путь

    const totalLength = linePath!.node()!.getTotalLength()

    linePath!
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)

    // --- Паттерн Enter-Update-Exit для точек ---
    const dots = svg.selectAll('.dot')
        .data(parsedData, d => (d as any).timestamp) // Ключ для корректного сопоставления данных

    // EXIT: Удаляем старые точки
    dots.exit()
        .transition(t)
        .attr('r', 0)
        .remove()

    // ENTER: Добавляем новые точки
    dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('fill', '#eabe0b')
        // ИЗМЕНЕНИЕ: Начинаем с конечных координат, но с нулевым радиусом
        .attr('cx', d => x!(d.timestamp))
        .attr('cy', d => y!(d.price))
        .attr('r', 0) // Начинаем с нулевого радиуса
        // --- Обработчики событий для Тултипа ---
        .on('mouseover', (event, d) => {
            if (!tooltipRef.value) return
            d3.select(tooltipRef.value)
                .style('opacity', 1)
                .html(`
                    <strong>Price:</strong> $${d3.format(',.2f')(d.price)}<br>
                    <strong>Date:</strong> ${d3.timeFormat('%b %d, %H:%M')(d.timestamp)}
                `)
        })
        .on('mousemove', (event) => {
            if (!tooltipRef.value || !chartContainer.value) return

            const containerRect = chartContainer.value.getBoundingClientRect()

            const x = event.clientX - containerRect.left
            const y = event.clientY - containerRect.top

            d3.select(tooltipRef.value)
                .style('left', `${x - 65}px`)
                .style('top', `${y - 60}px`)
        })
        .on('mouseout', () => {
            if (!tooltipRef.value) return
            d3.select(tooltipRef.value).style('opacity', 0)
        })
        // UPDATE + ENTER: Анимируем только радиус точек
        .merge(dots as any)
        .transition(t)
        .attr('r', 3) // Анимируем только радиус (0 -> 3)
        .attr('cx', d => x!(d.timestamp))
        .attr('cy', d => y!(d.price))
}

// --- Хуки жизненного цикла ---
onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        if (chartContainer.value) {
            updateChart() // Вызываем обновление вместо полной перерисовки
        }
    })

    if (chartContainer.value) {
        resizeObserver.observe(chartContainer.value)
        initChart() // Инициализируем график один раз
    }
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})

watch(() => props.data, () => {
    updateChart() // Вызываем обновление вместо полной перерисовки
}, { deep: true })
</script>

<style scoped>
.chart-container {
    width: 100%;
    overflow: hidden;
    background: rgba(20, 20, 20, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(234, 190, 11, 0.15);
    /* Добавляем position: relative, чтобы позиционировать тултип относительно контейнера */
    position: relative;
}

/* Стили для тултипа */
.tooltip {
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #eabe0b;
    border-radius: 5px;
    color: white;
    padding: 8px 12px;
    font-size: 12px;
    transition: opacity 0.2s ease;
    text-align: left;
    white-space: nowrap;
}

:global(.grid line) {
    stroke: #07f19f;
    stroke-opacity: 0.1;
    shape-rendering: crispEdges;
}

:global(.grid path) {
    stroke-width: 0;
}

:global(.dot) {
    transition: r 0.2s ease, stroke 0.2s ease;
}

:global(.dot:hover) {
    r: 6; /* Увеличим радиус при наведении для лучшей интерактивности */
    stroke: white;
    stroke-width: 2px;
    cursor: pointer;
}

:global(svg .tick text) {
    font-size: 12px;
    fill: #ccc;
}
</style>
