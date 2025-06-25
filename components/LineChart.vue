<template>
    <div ref="chartContainer" class="chart-container">
        <svg ref="svgRef"></svg>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type PropType } from 'vue'
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

const drawChart = () => {
    if (!svgRef.value || !chartContainer.value || !props.data || props.data.length === 0) {
        return
    }

    // Очищаем SVG перед перерисовкой
    d3.select(svgRef.value).selectAll('*').remove()

    // Размеры
    const margin = { top: 20, right: 30, bottom: 40, left: 70 }
    const width = chartContainer.value.clientWidth - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const svg = d3.select(svgRef.value)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    // Парсим данные
    const parsedData = props.data.map(d => ({
        timestamp: new Date(+d.timestamp),
        price: +d.price // Убедимся, что цена - это число
    }))

    // Шкалы
    const x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp) as [Date, Date])
        .range([0, width])

    const y = d3.scaleLinear()
        .domain([d3.min(parsedData, d => d.price) as number * 0.99, d3.max(parsedData, d => d.price) as number * 1.01])
        .range([height, 0])

    // Оси
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat('%H:%M')))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d => `$${d.toLocaleString()}`))

    // Сетка
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeHour.every(1)).tickSize(-height).tickFormat(() => ''))

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''))

    // Градиент для области под линией
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'price-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');

    linearGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(150,5,161)');
    linearGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(241,147,7)');

    // Область
    const area = d3.area<{ timestamp: Date, price: number }>()
        .x(d => x(d.timestamp))
        .y0(height)
        .y1(d => y(d.price))

    svg.append('path')
        .datum(parsedData)
        .attr('fill', 'url(#price-gradient)')
        .attr('d', area)

    // Линия
    const line = d3.line<{ timestamp: Date, price: number }>()
        .x(d => x(d.timestamp))
        .y(d => y(d.price))
        .curve(d3.curveMonotoneX)

    svg.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#eabe0b')
        .attr('stroke-width', 2)
        .attr('d', line)
}

onMounted(() => {
    drawChart()
    window.addEventListener('resize', drawChart)
})

watch(() => props.data, () => {
    drawChart()
}, { deep: true })
</script>

<style scoped>
.chart-container {
    width: 100%;
    max-width: 900px;
    margin: 2rem auto;
}
:global(.grid line) {
    stroke: #07f19f;
    stroke-opacity: 0.2;
    shape-rendering: crispEdges;
}
:global(.grid path) {
    stroke-width: 0;
}
</style>
