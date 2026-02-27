/**
 * uTools API 类型定义
 */

interface UToolsDB {
  /**
   * 存储文档
   */
  put(doc: {
    _id: string
    data: any
    _rev?: string
  }): { id: string; ok: boolean; rev: string } | false

  /**
   * 获取文档
   */
  get(id: string): {
    _id: string
    _rev: string
    data: any
  } | null

  /**
   * 删除文档
   */
  remove(id: string): { id: string; ok: boolean; rev: string } | false

  /**
   * 批量存储
   */
  bulkDocs(docs: Array<{ _id: string; data: any; _rev?: string }>): Array<{
    id: string
    ok: boolean
    rev: string
  }>

  /**
   * 获取所有文档
   */
  allDocs(key?: string): Array<{
    _id: string
    _rev: string
    data: any
  }>
}

interface UTools {
  /**
   * 数据库 API
   */
  db: UToolsDB

  /**
   * 隐藏主窗口
   */
  hideMainWindow(): void

  /**
   * 显示主窗口
   */
  showMainWindow(): void

  /**
   * 显示通知
   */
  showNotification(body: string, clickFeatureCode?: string): void

  /**
   * 获取当前浏览器窗口的 URL
   */
  getCurrentBrowserUrl(): string | null

  /**
   * 获取当前文件夹路径
   */
  getCurrentFolderPath(): string | null

  /**
   * 复制文本到剪贴板
   */
  copyText(text: string): boolean

  /**
   * 复制图片到剪贴板
   */
  copyImage(img: string | Buffer): boolean

  /**
   * 复制文件到剪贴板
   */
  copyFile(file: string | string[]): boolean

  /**
   * 显示文件选择对话框
   */
  showOpenDialog(options: {
    title?: string
    defaultPath?: string
    buttonLabel?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: Array<
      'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'
    >
  }): string[] | undefined

  /**
   * 显示文件保存对话框
   */
  showSaveDialog(options: {
    title?: string
    defaultPath?: string
    buttonLabel?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }): string | undefined

  /**
   * 获取路径
   */
  getPath(name: 'home' | 'appData' | 'userData' | 'temp' | 'exe' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs'): string

  /**
   * 获取文件图标
   */
  getFileIcon(filePath: string): string

  /**
   * 读取剪贴板
   */
  readClipboard(): string

  /**
   * 获取当前窗口 ID
   */
  getCurrentWindowId(): number

  /**
   * 是否 macOS
   */
  isMacOs(): boolean

  /**
   * 是否 Windows
   */
  isWindows(): boolean

  /**
   * 是否 Linux
   */
  isLinux(): boolean
}

declare global {
  interface Window {
    utools?: UTools
    exports?: any
  }
}

export {}
