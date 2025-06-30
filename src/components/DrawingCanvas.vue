<template>
  <div class="drawing-canvas-container">
    <canvas 
      ref="canvas"
      :width="width"
      :height="height"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrawing"
    ></canvas>
    
    <div class="toolbar">
      <el-button-group>
        <el-button 
          v-for="color in colors" 
          :key="color"
          :style="{ backgroundColor: color }"
          @click="setColor(color)"
        />
      </el-button-group>
      
      <el-slider 
        v-model="lineWidth" 
        :min="1" 
        :max="20"
        show-input
        style="width: 150px; margin: 0 15px;"
      />
      
      <el-button icon="el-icon-delete" @click="clearCanvas">清除</el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  props: {
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 500
    }
  },
  emits: ['canvas-updated'],
  setup(props, { emit, expose }) {
    const canvas = ref(null)
    const ctx = ref(null)
    const isDrawing = ref(false)
    const lastX = ref(0)
    const lastY = ref(0)
    const lineWidth = ref(3)
    const strokeColor = ref('#000000')
    
    const colors = ref([
      '#000000', '#ff0000', '#00ff00', '#0000ff', 
      '#ffff00', '#00ffff', '#ff00ff', '#ffffff'
    ])
    
    const initCanvas = () => {
      if (canvas.value) {
        ctx.value = canvas.value.getContext('2d')
        ctx.value.lineJoin = 'round'
        ctx.value.lineCap = 'round'
        ctx.value.strokeStyle = strokeColor.value
        ctx.value.lineWidth = lineWidth.value
        clearCanvas()
      }
    }
    
    const startDrawing = (e) => {
      isDrawing.value = true;
      const rect = canvas.value.getBoundingClientRect()
      lastX.value = e.clientX - rect.left
      lastY.value = e.clientY - rect.top
    }
    
    const draw = (e) => {
      if (!isDrawing.value) return
      
      const rect = canvas.value.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      ctx.value.beginPath()
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(currentX, currentY)
      ctx.value.stroke()
      
      lastX.value = currentX
      lastY.value = currentY
      
      emitCanvasData()
    }
    
    const stopDrawing = () => {
      isDrawing.value = false
      emitCanvasData()
    }
    
    const clearCanvas = () => {
      if (ctx.value) {
        ctx.value.fillStyle = '#ffffff'
        ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
        emitCanvasData()
      }
    }
    
    const setColor = (color) => {
      strokeColor.value = color
      if (ctx.value) {
        ctx.value.strokeStyle = color
      }
    }
    
    const emitCanvasData = () => {
      if (canvas.value) {
        const dataUrl = canvas.value.toDataURL('image/png')
        emit('canvas-updated', dataUrl)
      }
    }
    
    const getCanvasData = () => {
      if (!canvas.value) return null
      return canvas.value.toDataURL('image/png')
    }
    
    // 触摸事件处理
    const handleTouchStart = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvas.value.dispatchEvent(mouseEvent)
    }
    
    const handleTouchMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvas.value.dispatchEvent(mouseEvent)
    }
    
    // 监听属性变化
    watch(lineWidth, (newWidth) => {
      if (ctx.value) {
        ctx.value.lineWidth = newWidth
      }
    })
    
    // 暴露方法给父组件
    expose({
      getCanvasData,
      clearCanvas
    })
    
    onMounted(initCanvas)
    
    return {
      canvas,
      isDrawing,
      lineWidth,
      colors,
      startDrawing,
      draw,
      stopDrawing,
      clearCanvas,
      setColor,
      handleTouchStart,
      handleTouchMove
    }
  }
}
</script>

<style scoped>
.drawing-canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

canvas {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

.toolbar {
  margin-top: 15px;
  display: flex;
  align-items: center;
}

.el-button-group .el-button {
  width: 25px;
  height: 25px;
  min-width: auto;
  padding: 0;
  border-radius: 50%;
  margin: 0 3px;
}
</style>