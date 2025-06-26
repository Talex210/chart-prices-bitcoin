<template>
    <div ref="chartContainer" class="chart-container">
        <svg ref="svgRef" />
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

const svgRef = ref<SVGSVGElement | null>(null)
const chartContainer = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const drawChart = () => {
    if (!svgRef.value || !chartContainer.value || !props.data || props.data.length === 0) {
        return
    }

    // Очищаем SVG перед перерисовкой
    d3.select(svgRef.value).selectAll('*').remove()

    // Размеры контейнера
    const containerWidth = chartContainer.value.clientWidth
    // Соотношение 16:9 (можно изменить на нужное)
    const containerHeight = Math.min(containerWidth * 0.5625, window.innerHeight * 0.7)

    // Отступы
    const margin = { top: 20, right: 10, bottom: 65, left: 70 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    const svg = d3.select(svgRef.value)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // Парсим данные
    const parsedData = props.data.map(d => ({
        timestamp: new Date(+d.timestamp),
        price: +d.price
    }))

    // Шкалы
    const x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp) as [Date, Date])
        .range([0, width])

    const y = d3.scaleLinear()
        .domain([
            d3.min(parsedData, d => d.price) as number * 0.99,
            d3.max(parsedData, d => d.price) as number * 1.01
        ])
        .range([height, 0])
        .nice()

    // Оси
    const xAxis = d3.axisBottom(x)
        .ticks(containerWidth > 600 ? 10 : 5)
        .tickFormat(d3.timeFormat(containerWidth > 600 ? '%b %d, %H:%M' : '%H:%M') as any)

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)')

    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d => `$ ${d3.format(',.0f')(d)}`))

    // Сетка
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ''))

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''))

    // Градиент
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')

    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(234, 190, 11, 0.4)')

    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(234, 190, 11, 0)')

    // Область
    const area = d3.area<{timestamp: Date, price: number}>()
        .x(d => x(d.timestamp))
        .y0(height)
        .y1(d => y(d.price))
        .curve(d3.curveMonotoneX)

    svg.append('path')
        .datum(parsedData)
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area)

    // Линия
    const line = d3.line<{timestamp: Date, price: number}>()
        .x(d => x(d.timestamp))
        .y(d => y(d.price))
        .curve(d3.curveMonotoneX)

    svg.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#eabe0b')
        .attr('stroke-width', 2)
        .attr('d', line)

    // Точки данных
    svg.selectAll('.dot')
        .data(parsedData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.timestamp))
        .attr('cy', d => y(d.price))
        .attr('r', 3)
        .attr('fill', '#eabe0b')
}

onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        if (chartContainer.value) {
            drawChart()
        }
    })

    if (chartContainer.value) {
        resizeObserver.observe(chartContainer.value)
        drawChart()
    }
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})

watch(() => props.data, () => {
    drawChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
    width: 100%;
    overflow: hidden;
    background: rgba(20, 20, 20, 0.8);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(234, 190, 11, 0.15);
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
    transition: r 0.2s ease;
}

:global(.dot:hover) {
    r: 5;
    stroke: white;
    stroke-width: 1;
}

:global(svg .tick text) {
    font-size: 12px;
    fill: #ccc;
}
</style>
