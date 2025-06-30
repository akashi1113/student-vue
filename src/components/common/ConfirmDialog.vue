<template>
  <el-dialog
      v-model="visible"
      :title="title"
      width="400px"
      :before-close="handleClose"
  >
    <div class="dialog-content">
      <el-icon class="warning-icon"><Warning /></el-icon>
      <p>{{ message }}</p>
      <el-input
          v-if="showInput"
          v-model="inputValue"
          :placeholder="inputPlaceholder"
          type="textarea"
          :rows="3"
          style="margin-top: 15px;"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
            type="primary"
            @click="handleConfirm"
            :loading="loading"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: '确定要执行此操作吗？'
  },
  showInput: {
    type: Boolean,
    default: false
  },
  inputPlaceholder: {
    type: String,
    default: '请输入原因'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const visible = ref(props.modelValue)
const inputValue = ref('')

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (!val) {
    inputValue.value = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm', inputValue.value)
}
</script>

<style scoped>
.dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #e6a23c;
  margin-bottom: 15px;
}

.dialog-content p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}
</style>