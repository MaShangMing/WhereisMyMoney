# 我的账本 (WhereIsMyMoney)

一款智能记账 App，核心亮点是**自动监听微信/支付宝收付款通知**，提取金额、商户等信息实现自动记账。

## 功能特点

- **自动记账**：监听微信/支付宝支付通知，自动创建记账记录
- **智能分类**：根据商户名称智能推荐消费分类
- **多平台支持**：支持 Android、iOS、鸿蒙系统
- **统计分析**：月度收支统计、分类占比、趋势图表
- **数据安全**：所有数据本地存储，支持备份恢复

## 长远规划

我们正在从“支付通知自动记账”扩展到“全资产管理”。详见：
- [长远发展规划（全资产管理）](docs/long-term-roadmap.md)

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 3 + TypeScript) |
| 状态管理 | Pinia |
| 本地存储 | SQLite |
| UI 组件 | 自定义组件 |

## 项目结构

```
WhereIsMyMoney/
├── src/
│   ├── pages/                    # 页面
│   │   ├── index/                # 首页（记账列表）
│   │   ├── add/                  # 添加记录
│   │   ├── statistics/           # 统计分析
│   │   ├── settings/             # 设置
│   │   ├── pending/              # 待确认记录
│   │   ├── categories/           # 分类管理
│   │   └── accounts/             # 账户管理
│   ├── components/               # 公共组件
│   │   ├── PieChart.vue          # 饼图组件
│   │   └── BarChart.vue          # 柱状图组件
│   ├── stores/                   # Pinia 状态管理
│   ├── utils/
│   │   ├── db.ts                 # SQLite 操作
│   │   ├── parser.ts             # 支付通知解析
│   │   ├── notification.ts       # Android 通知监听
│   │   ├── clipboard.ts          # 剪贴板监控
│   │   ├── share-extension.ts    # iOS Share Extension
│   │   ├── harmony-notification.ts # 鸿蒙通知监听
│   │   └── export.ts             # 数据导出
│   ├── types/                    # TypeScript 类型定义
│   └── static/                   # 静态资源
├── nativeplugins/                # 原生插件
│   ├── NotificationListener/     # Android 通知监听
│   ├── ShareExtension/           # iOS Share Extension
│   └── HarmonyNotificationListener/ # 鸿蒙通知监听
├── docs/                         # 文档
│   └── ios-shortcuts-guide.md    # iOS 快捷指令配置指南
└── package.json
```

## 各平台自动记账实现

### Android
使用 `NotificationListenerService` 监听系统通知：
- 需要用户在系统设置中授权通知访问权限
- 实时监听微信/支付宝支付通知
- 自动解析金额和商户信息

### iOS
由于系统限制，采用多种替代方案：
1. **快捷指令自动化**（推荐）：配置 iOS Shortcuts 在收到通知时触发
2. **剪贴板识别**：复制支付信息后自动识别
3. **Share Extension**：通过分享功能导入支付截图/文本

### 鸿蒙 (HarmonyOS NEXT)
使用 `notificationSubscribe` API 监听通知：
- 类似 Android 的实现方式
- 需要 `ohos.permission.NOTIFICATION_CONTROLLER` 权限

## 开发指南

### 环境要求

- Node.js >= 18
- HBuilderX 或 VS Code + uni-app 插件
- Android Studio（开发 Android 原生插件）
- Xcode（开发 iOS 原生插件）
- DevEco Studio（开发鸿蒙原生插件）

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
# H5 开发
npm run dev:h5

# App 开发（需要 HBuilderX）
npm run dev:app

# 微信小程序
npm run dev:mp-weixin
```

### 打包构建

```bash
# H5 构建
npm run build:h5

# App 构建
npm run build:app
```

## 数据库结构

### transactions（交易记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| type | TEXT | 类型（income/expense） |
| amount | REAL | 金额 |
| category_id | INTEGER | 分类 ID |
| account_id | INTEGER | 账户 ID |
| merchant | TEXT | 商户名称 |
| note | TEXT | 备注 |
| source | TEXT | 来源（manual/wechat/alipay） |
| created_at | TEXT | 创建时间 |
| confirmed | INTEGER | 是否已确认 |

### categories（分类）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 分类名称 |
| icon | TEXT | 图标（emoji） |
| type | TEXT | 类型（income/expense） |
| sort_order | INTEGER | 排序 |

### accounts（账户）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 账户名称 |
| icon | TEXT | 图标（emoji） |
| balance | REAL | 余额 |

## 隐私说明

1. **本地存储**：所有数据仅存储在用户设备本地
2. **通知监听**：仅用于识别支付信息，不会上传任何数据
3. **无网络请求**：App 不会向任何服务器发送数据

## 许可证

MIT License
