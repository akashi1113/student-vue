<template>
  <div class="analytics-card" :class="type">
    <div class="card-header">
      <div class="card-icon">
        <i :class="icon"></i>
      </div>
      <div class="card-title">{{ title }}</div>
    </div>
    <div class="card-content">
      <div class="card-value">{{ formattedValue }}</div>
      <div v-if="trend" class="card-trend" :class="trend.type">
        <i :class="trend.icon"></i>
        <span>{{ trend.value }}</span>
      </div>
    </div>
    <div v-if="description" class="card-description">
      {{ description }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsCard',
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      required: true
    },
    type: {
      type: String,
      default: 'default',
      validator: value => ['default', 'success', 'warning', 'danger', 'info'].includes(value)
    },
    icon: {
      type: String,
      default: 'el-icon-data-analysis'
    },
    trend: {
      type: Object,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    format: {
      type: String,
      default: 'number', // number, percentage, currency
      validator: value => ['number', 'percentage', 'currency'].includes(value)
    }
  },
  computed: {
    formattedValue() {
      if (this.format === 'percentage') {
        return `${this.value}%`
      } else if (this.format === 'currency') {
        return `¥${this.value}`
      } else {
        return this.value.toLocaleString()
      }
    }
  }
}
</script>

<style scoped>
.analytics-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.analytics-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.default .card-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.success .card-icon {
  background: #f6ffed;
  color: #52c41a;
}

.warning .card-icon {
  background: #fffbe6;
  color: #faad14;
}

.danger .card-icon {
  background: #fff2f0;
  color: #ff4d4f;
}

.info .card-icon {
  background: #f0f5ff;
  color: #722ed1;
}

.card-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.card-content {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.card-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-trend.up {
  color: #52c41a;
  background: #f6ffed;
}

.card-trend.down {
  color: #ff4d4f;
  background: #fff2f0;
}

.card-trend i {
  margin-right: 4px;
}

.card-description {
  font-size: 12px;
  color: #999;
  margin-top: auto;
}
</style> 