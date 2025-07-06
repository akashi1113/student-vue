<template>
  <div ref="chartRef" class="bar-chart"></div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import * as echarts from 'echarts'
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const option = {
    title: {
      text: '各模块操作总数',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 600
      }
    },
    tooltip: {},
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.module),
      axisLabel: { fontSize: 14, interval: 0 }
    },
    yAxis: {
      type: 'value',
      name: '操作总数',
      nameTextStyle: { fontSize: 14 }
    },
    series: [
      {
        name: '操作总数',
        type: 'bar',
        data: props.data.map(item => item.count),
        itemStyle: {
          color: '#409EFF'
        },
        barWidth: 32
      }
    ]
  }
  chartInstance.setOption(option)
}

watch(() => props.data, renderChart, { deep: true })
onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})
function resizeChart() {
  if (chartInstance) chartInstance.resize()
}
</script>

<style scoped>
.bar-chart {
  width: 100%;
  height: 340px;
}
</style> 