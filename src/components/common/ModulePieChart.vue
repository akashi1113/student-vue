<template>
  <div ref="chartWrapper" style="width: 100%; margin-top: 32px; display: flex; flex-direction: row; align-items: flex-start; justify-content: center;">
    <div style="flex: 0 0 260px; display: flex; flex-direction: column; align-items: flex-start; margin-right: 32px;">
      <div style="font-size: 22px; font-weight: bold; margin-bottom: 24px;">各模块操作总数分布</div>
      <div v-if="legendData.length" style="margin-bottom: 24px;">
        <div v-for="item in legendData" :key="item" style="display: flex; align-items: center; margin-bottom: 8px;">
          <span :style="{display: 'inline-block', width: '16px', height: '16px', background: getColor(item), marginRight: '8px', borderRadius: '3px'}"></span>
          <span>{{ item }}</span>
        </div>
      </div>
      <el-button type="primary" @click="exportPDF">导出PDF</el-button>
    </div>
    <div ref="pieChart" style="width: 420px; height: 320px;"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const pieChart = ref(null)
const chartInstance = ref(null)
const chartWrapper = ref(null)

const legendData = computed(() => props.data.map(item => item.module))

// 获取ECharts自动分配的颜色
function getColor(moduleName) {
  if (!chartInstance.value) return '#ccc'
  const option = chartInstance.value.getOption()
  if (option && option.color) {
    const idx = legendData.value.findIndex(m => m === moduleName)
    return option.color[idx % option.color.length]
  }
  return '#ccc'
}

function renderChart() {
  if (!pieChart.value) return
  if (!chartInstance.value) {
    chartInstance.value = echarts.init(pieChart.value)
  }
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    color: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
    ],
    series: [
      {
        name: '操作总数',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: props.data.map(item => ({ name: item.module, value: item.count })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: function(params) {
            // 超过6个字自动换行
            const name = params.name || ''
            return name.length > 6 ? name.replace(/(.{6})/g, '$1\n') + `: ${params.value} (${params.percent}%)` : `${name}: ${params.value} (${params.percent}%)`
          },
          fontSize: 15,
          overflow: 'break',
          lineHeight: 18
        }
      }
    ]
  }
  chartInstance.value.setOption(option)
}

watch(() => props.data, () => {
  renderChart()
}, { deep: true })

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  window.removeEventListener('resize', resizeChart)
})

function resizeChart() {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

async function exportPDF() {
  if (!chartWrapper.value) return
  // 截图整个chart区域
  const canvas = await html2canvas(chartWrapper.value, { useCORS: true })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  // 计算图片宽高自适应pdf
  const imgWidth = pageWidth * 0.9
  const imgHeight = canvas.height * (imgWidth / canvas.width)
  pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight)
  pdf.save('模块操作分布.pdf')
}
</script> 