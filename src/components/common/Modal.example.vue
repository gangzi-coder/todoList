<template>
  <div class="modal-example">
    <h2>Modal 组件示例</h2>
    
    <div class="example-section">
      <h3>基础用法</h3>
      <button @click="showBasicModal = true">打开基础模态框</button>
      <Modal
        v-model="showBasicModal"
        title="基础模态框"
        content="这是一个基础的模态框示例。"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </div>

    <div class="example-section">
      <h3>自定义内容</h3>
      <button @click="showCustomModal = true">打开自定义内容模态框</button>
      <Modal
        v-model="showCustomModal"
        title="自定义内容"
        @confirm="handleConfirm"
      >
        <div>
          <p>这是自定义的内容区域。</p>
          <ul>
            <li>支持任意 HTML 内容</li>
            <li>可以包含表单元素</li>
            <li>可以包含其他组件</li>
          </ul>
        </div>
      </Modal>
    </div>

    <div class="example-section">
      <h3>危险操作确认</h3>
      <button @click="showDangerModal = true">删除操作</button>
      <Modal
        v-model="showDangerModal"
        title="确认删除"
        content="确定要删除这个项目吗？此操作不可撤销。"
        confirm-text="删除"
        :confirm-danger="true"
        @confirm="handleDelete"
      />
    </div>

    <div class="example-section">
      <h3>仅确认按钮</h3>
      <button @click="showInfoModal = true">显示信息</button>
      <Modal
        v-model="showInfoModal"
        title="提示信息"
        content="操作已成功完成！"
        :show-cancel="false"
        confirm-text="知道了"
        @confirm="showInfoModal = false"
      />
    </div>

    <div class="example-section">
      <h3>不同尺寸</h3>
      <button @click="showSmallModal = true">小尺寸</button>
      <button @click="showLargeModal = true">大尺寸</button>
      <Modal
        v-model="showSmallModal"
        title="小尺寸模态框"
        content="这是一个小尺寸的模态框。"
        size="small"
      />
      <Modal
        v-model="showLargeModal"
        title="大尺寸模态框"
        size="large"
      >
        <div>
          <p>这是一个大尺寸的模态框，适合显示更多内容。</p>
          <p>可以包含长文本、表格、表单等复杂内容。</p>
        </div>
      </Modal>
    </div>

    <div class="example-section">
      <h3>禁用遮罩关闭</h3>
      <button @click="showNoOverlayCloseModal = true">打开（禁用遮罩关闭）</button>
      <Modal
        v-model="showNoOverlayCloseModal"
        title="禁用遮罩关闭"
        content="点击遮罩不会关闭此模态框，只能通过按钮或 Esc 键关闭。"
        :close-on-click-overlay="false"
      />
    </div>

    <div class="example-section">
      <h3>自定义底部</h3>
      <button @click="showCustomFooterModal = true">打开自定义底部</button>
      <Modal
        v-model="showCustomFooterModal"
        title="自定义底部"
        content="这个模态框有自定义的底部按钮。"
      >
        <template #footer>
          <button @click="showCustomFooterModal = false">稍后</button>
          <button @click="handleSave">保存草稿</button>
          <button @click="handlePublish">发布</button>
        </template>
      </Modal>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'

const showBasicModal = ref(false)
const showCustomModal = ref(false)
const showDangerModal = ref(false)
const showInfoModal = ref(false)
const showSmallModal = ref(false)
const showLargeModal = ref(false)
const showNoOverlayCloseModal = ref(false)
const showCustomFooterModal = ref(false)
const message = ref('')

const showMessage = (msg: string) => {
  message.value = msg
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const handleConfirm = () => {
  showMessage('已确认')
  showBasicModal.value = false
  showCustomModal.value = false
}

const handleCancel = () => {
  showMessage('已取消')
}

const handleDelete = () => {
  showMessage('已删除')
  showDangerModal.value = false
}

const handleSave = () => {
  showMessage('已保存草稿')
  showCustomFooterModal.value = false
}

const handlePublish = () => {
  showMessage('已发布')
  showCustomFooterModal.value = false
}
</script>

<style scoped>
.modal-example {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 30px;
  color: #1f2937;
}

h3 {
  margin-bottom: 15px;
  color: #374151;
  font-size: 16px;
}

.example-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
}

button {
  padding: 8px 16px;
  margin-right: 10px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #2563eb;
}

.message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background-color: #10b981;
  color: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
