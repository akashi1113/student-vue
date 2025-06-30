<template>
    <div class="simple-chart">
      <div class="chart-header">
        <h4>{{ title }}</h4>
      </div>
      
      <!-- 柱状图 -->
      <div v-if="type === 'bar'" class="bar-chart">
        <div v-for="(item, index) in data" :key="index" class="bar-item">
          <div class="bar-label">{{ item.name || item.label }}</div>
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ 
                height: getBarHeight(item.value),
                backgroundColor: getBarColor(index)
              }"
            >
              <span class="bar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 折线图 -->
      <div v-else-if="type === 'line'" class="line-chart">
        <svg :width="chartWidth" :height="chartHeight" class="line-svg">
          <polyline
            :points="getLinePoints()"
            fill="none"
            stroke="#409eff"
            stroke-width="3"
          />
          <circle
            v-for="(point, index) in getCirclePoints()"
            :key="index"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="#409eff"
          />
        </svg>
        <div class="line-labels">
          <span v-for="(item, index) in data" :key="index" class="line-label">
            {{ item.name || item.label }}
          </span>
        </div>
      </div>
      
      <!-- 饼图 -->
      <div v-else-if="type === 'pie'" class="pie-chart">
        <svg :width="pieSize" :height="pieSize" class="pie-svg">
          <g :transform="`translate(${pieSize/2}, ${pieSize/2})`">
            <path
              v-for="(segment, index) in getPieSegments()"
              :key="index"
              :d="segment.path"
              :fill="segment.color"
              class="pie-segment"
            />
          </g>
        </svg>
        <div class="pie-legend">
          <div v-for="(item, index) in data" :key="index" class="legend-item">
            <div class="legend-color" :style="{ backgroundColor: getBarColor(index) }"></div>
            <span class="legend-text">{{ item.name }} ({{ item.value }})</span>
          </div>
        </div>
      </div>
      
      <!-- 雷达图 -->
      <div v-else-if="type === 'radar'" class="radar-chart">
        <svg :width="radarSize" :height="radarSize" class="radar-svg">
          <g :transform="`translate(${radarSize/2}, ${radarSize/2})`">
            <!-- 网格线 -->
            <g class="radar-grid">
              <circle v-for="i in 5" :key="i" :r="i * radarRadius / 5" fill="none" stroke="#e0e0e0" />
              <line v-for="(point, index) in getRadarAxisPoints()" :key="index"
                :x1="0" :y1="0" :x2="point.x" :y2="point.y" stroke="#e0e0e0" />
            </g>
            <!-- 数据区域 -->
            <polygon 
              :points="getRadarDataPoints()" 
              fill="rgba(64, 158, 255, 0.3)" 
              stroke="#409eff" 
              stroke-width="2"
            />
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in getRadarCirclePoints()"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              fill="#409eff"
            />
          </g>
        </svg>
        <div class="radar-labels">
          <div v-for="(item, index) in data" :key="index" 
            class="radar-label"
            :style="getRadarLabelStyle(index)">
            {{ item.name }}
          </div>
        </div>
      </div>
      
      <!-- 数据表格fallback -->
      <div v-else class="data-table">
        <table>
          <thead>
            <tr>
              <th>项目</th>
              <th>数值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data" :key="index">
              <td>{{ item.name || item.label }}</td>
              <td>{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SimpleChart',
    props: {
      type: {
        type: String,
        default: 'bar' // bar, line, pie, radar
      },
      title: {
        type: String,
        default: '图表'
      },
      data: {
        type: Array,
        default: () => []
      },
      width: {
        type: Number,
        default: 400
      },
      height: {
        type: Number,
        default: 300
      }
    },
    computed: {
      chartWidth() {
        return this.width
      },
      chartHeight() {
        return this.height
      },
      pieSize() {
        return Math.min(this.width, this.height, 300)
      },
      radarSize() {
        return Math.min(this.width, this.height, 300)
      },
      radarRadius() {
        return this.radarSize * 0.35
      },
      maxValue() {
        return Math.max(...this.data.map(item => item.value || 0))
      }
    },
    methods: {
      getBarHeight(value) {
        const maxHeight = this.height - 60
        return Math.max(20, (value / this.maxValue) * maxHeight) + 'px'
      },
      
      getBarColor(index) {
        const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#c71585']
        return colors[index % colors.length]
      },
      
      getLinePoints() {
        if (!this.data.length) return ''
        
        const width = this.chartWidth - 40
        const height = this.chartHeight - 60
        const stepX = width / (this.data.length - 1)
        
        return this.data.map((item, index) => {
          const x = 20 + index * stepX
          const y = 20 + height - (item.value / this.maxValue) * height
          return `${x},${y}`
        }).join(' ')
      },
      
      getCirclePoints() {
        if (!this.data.length) return []
        
        const width = this.chartWidth - 40
        const height = this.chartHeight - 60
        const stepX = width / (this.data.length - 1)
        
        return this.data.map((item, index) => ({
          x: 20 + index * stepX,
          y: 20 + height - (item.value / this.maxValue) * height
        }))
      },
      
      getPieSegments() {
        const total = this.data.reduce((sum, item) => sum + item.value, 0)
        let currentAngle = 0
        const segments = []
        
        this.data.forEach((item, index) => {
          const percentage = item.value / total
          const angle = percentage * 2 * Math.PI
          const endAngle = currentAngle + angle
          
          const radius = this.pieSize * 0.4
          const largeArc = angle > Math.PI ? 1 : 0
          
          const x1 = radius * Math.cos(currentAngle)
          const y1 = radius * Math.sin(currentAngle)
          const x2 = radius * Math.cos(endAngle)
          const y2 = radius * Math.sin(endAngle)
          
          const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
          
          segments.push({
            path,
            color: this.getBarColor(index)
          })
          
          currentAngle = endAngle
        })
        
        return segments
      },
      
      getRadarAxisPoints() {
        return this.data.map((_, index) => {
          const angle = (index / this.data.length) * 2 * Math.PI - Math.PI / 2
          return {
            x: this.radarRadius * Math.cos(angle),
            y: this.radarRadius * Math.sin(angle)
          }
        })
      },
      
      getRadarDataPoints() {
        return this.data.map((item, index) => {
          const angle = (index / this.data.length) * 2 * Math.PI - Math.PI / 2
          const value = (item.value || 0) / 100 // 假设数据是0-100的百分比
          const radius = this.radarRadius * value
          const x = radius * Math.cos(angle)
          const y = radius * Math.sin(angle)
          return `${x},${y}`
        }).join(' ')
      },
      
      getRadarCirclePoints() {
        return this.data.map((item, index) => {
          const angle = (index / this.data.length) * 2 * Math.PI - Math.PI / 2
          const value = (item.value || 0) / 100
          const radius = this.radarRadius * value
          return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          }
        })
      },
      
      getRadarLabelStyle(index) {
        const angle = (index / this.data.length) * 2 * Math.PI - Math.PI / 2
        const labelRadius = this.radarRadius + 30
        const x = this.radarSize / 2 + labelRadius * Math.cos(angle)
        const y = this.radarSize / 2 + labelRadius * Math.sin(angle)
        
        return {
          position: 'absolute',
          left: x - 30 + 'px',
          top: y - 10 + 'px',
          width: '60px',
          textAlign: 'center'
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .simple-chart {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .chart-header h4 {
    margin: 0 0 20px 0;
    color: #333;
    text-align: center;
  }
  
  .bar-chart {
    display: flex;
    align-items: end;
    justify-content: space-around;
    height: 250px;
    padding: 20px 0;
  }
  
  .bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 80px;
  }
  
  .bar-container {
    height: 200px;
    width: 40px;
    background: #f0f0f0;
    border-radius: 4px;
    display: flex;
    align-items: end;
    margin-bottom: 10px;
    position: relative;
  }
  
  .bar-fill {
    width: 100%;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
    transition: height 0.5s ease;
  }
  
  .bar-label {
    font-size: 12px;
    color: #666;
    text-align: center;
    word-break: break-all;
  }
  
  .line-chart {
    position: relative;
  }
  
  .line-svg {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
  }
  
  .line-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    padding: 0 20px;
  }
  
  .line-label {
    font-size: 12px;
    color: #666;
  }
  
  .pie-chart {
    display: flex;
    align-items: center;
    gap: 30px;
  }
  
  .pie-svg {
    flex-shrink: 0;
  }
  
  .pie-segment {
    transition: opacity 0.3s;
    cursor: pointer;
  }
  
  .pie-segment:hover {
    opacity: 0.8;
  }
  
  .pie-legend {
    flex: 1;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .legend-text {
    font-size: 14px;
    color: #333;
  }
  
  .radar-chart {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .radar-svg {
    border-radius: 50%;
  }
  
  .radar-labels {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .radar-label {
    font-size: 12px;
    color: #333;
    font-weight: 500;
  }
  
  .data-table {
    overflow-x: auto;
  }
  
  .data-table table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .data-table th {
    background: #f8f9fa;
    font-weight: 500;
    color: #333;
  }
  </style>