/**
 * uTools 插件预加载脚本
 *
 * 在插件加载前执行，用于：
 * 1. 暴露 uTools API 给渲染进程
 * 2. 处理插件生命周期事件
 * 3. 提供数据库和通知的桥接接口
 *
 * 需求 11.1: 使用 uTools 数据库 API 持久化数据
 * 需求 6.3: 通过 uTools 发送系统通知
 */

// uTools 插件进入事件处理
if (typeof window !== 'undefined') {
  /**
   * 插件进入时触发
   * 当用户通过关键词唤起插件时调用
   */
  window.addEventListener('utools-plugin-enter', (event) => {
    const { code, type, payload } = event.detail || {}

    // 将进入信息存储到 sessionStorage，供 Vue 应用读取
    try {
      sessionStorage.setItem(
        'utools-enter-info',
        JSON.stringify({ code, type, payload, timestamp: Date.now() })
      )
    } catch (e) {
      // sessionStorage 不可用时忽略
    }

    console.log('[preload] 插件进入:', code, type)
  })

  /**
   * 插件退出时触发
   * 用于清理资源和保存状态
   */
  window.addEventListener('utools-plugin-out', () => {
    console.log('[preload] 插件退出')

    // 触发自定义事件，通知 Vue 应用保存数据
    window.dispatchEvent(new CustomEvent('plugin-before-exit'))
  })

  /**
   * 插件分离时触发（窗口隐藏但插件未卸载）
   */
  window.addEventListener('utools-plugin-detach', () => {
    console.log('[preload] 插件分离')
  })
}
