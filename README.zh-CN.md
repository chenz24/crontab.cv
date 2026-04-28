<p align="center">
  <img src="src/assets/favicon.svg" width="64" height="64" alt="crontab.cv logo" />
</p>

<h1 align="center">crontab.cv</h1>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  可视化、实时、时区感知的 Cron 表达式编辑器。<br/>
  开源 · 无追踪 · 支持离线。
</p>

<p align="center">
  <a href="https://crontab.cv">在线体验</a> ·
  <a href="https://crontab.cv/docs">文档</a> ·
  <a href="https://github.com/chenz24/crontab.cv/issues">反馈 Bug</a> ·
  <a href="https://github.com/chenz24/crontab.cv/issues">功能建议</a>
</p>

<p align="center">
  <a href="https://github.com/chenz24/crontab.cv/blob/main/LICENSE"><img src="https://img.shields.io/github/license/chenz24/crontab.cv?style=flat-square" alt="MIT License" /></a>
  <a href="https://github.com/chenz24/crontab.cv/stargazers"><img src="https://img.shields.io/github/stars/chenz24/crontab.cv?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/chenz24/crontab.cv/issues"><img src="https://img.shields.io/github/issues/chenz24/crontab.cv?style=flat-square" alt="Issues" /></a>
</p>

<p align="center">
  <img src="public/screenshot.png" alt="crontab.cv screenshot" width="1200" />
</p>

---

## 功能特性

- **可视化编辑** — 通过数字网格点击选择，自动合并范围与列表。
- **实时翻译** — 基于 [cronstrue](https://github.com/bradymholt/cronstrue) 即时将 Cron 表达式转为自然语言。
- **双 Cron 方言** — 同时支持 5 字段 POSIX/Vixie Cron 与 6 字段 Quartz Cron（含 `L` / `W` / `#` / `?` 扩展）。
- **时区支持** — 可切换服务端与本地时区，实时计算未来 5 次执行时间。
- **多语言代码生成** — 一键生成 Crontab、Go、Node.js、Python、Java（Spring）代码片段。
- **平台配置模板** — 内置 Kubernetes CronJob、GitHub Actions、GitLab CI、AWS EventBridge、Vercel Cron、Cloudflare Workers、Spring `@Scheduled` 等可直接粘贴的配置。
- **Crontab 文件构建器** — 支持配置 SHELL、MAILTO、命令、日志重定向和注释，生成完整 crontab 文件。
- **任务时长与重叠检测** — 可设置预估任务耗时，直观显示与触发周期的重叠风险。
- **URL 分享** — 表达式、时区和选项都可编码进 URL，复制链接即可分享。
- **国际化** — 支持 English、简体中文、日本語、Français、Deutsch、Español。
- **明暗主题** — 跟随系统偏好，并支持手动切换。
- **隐私优先** — 全部在浏览器端运行，不上传数据；首次加载后可离线使用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [TanStack Start](https://tanstack.com/start)（SSR）+ [React 19](https://react.dev) |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) |
| UI 组件 | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Cron 解析 | [cron-parser](https://github.com/harrisiirak/cron-parser) + [cronstrue](https://github.com/bradymholt/cronstrue) |
| 时区处理 | [date-fns-tz](https://github.com/marnusw/date-fns-tz) |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| i18n | [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) |
| 图标 | [Lucide React](https://lucide.dev) |
| 代码检查 | [Biome](https://biomejs.dev) |
| 部署 | [Cloudflare Workers](https://workers.cloudflare.com) + [@cloudflare/vite-plugin](https://github.com/cloudflare/workers-sdk) |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 9

### 安装

```bash
# 克隆仓库
git clone https://github.com/chenz24/crontab.cv.git
cd crontab.cv

# 安装依赖
pnpm install
```

### 开发

```bash
pnpm dev
```

应用默认运行在 `http://localhost:5173`（或终端显示的端口）。

### 构建

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### Lint 与格式化

```bash
# Lint
pnpm lint

# Format
pnpm format

# 同时检查并修复
pnpm check
```

## 项目结构

```text
crontab.cv/
├── messages/              # i18n 文案文件（en, zh, ja, fr, de, es）
├── project.inlang/        # Paraglide / inlang 配置
├── src/
│   ├── components/
│   │   ├── crontab/       # 核心编辑器组件
│   │   │   ├── FieldModeEditor.tsx   # 字段模式编辑器（every/step/range/specific/quartz）
│   │   │   ├── OutputPanel.tsx       # Crontab 文件、代码片段与平台配置输出
│   │   │   ├── ValueGrid.tsx         # 可点击数字网格
│   │   │   ├── DualTimeRow.tsx       # 服务端/本地时间对照
│   │   │   ├── DurationBar.tsx       # 时长与重叠可视化
│   │   │   ├── TimezoneBar.tsx       # 时区选择器
│   │   │   ├── constants.ts          # 字段、预设、时区列表
│   │   │   └── utils.ts              # 纯函数工具
│   │   ├── ui/            # shadcn/ui 基础组件
│   │   ├── Crontab.tsx    # 主编辑器编排
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── cron-platforms.ts   # 平台配置生成
│   │   ├── i18n.tsx            # i18n hooks
│   │   └── utils.ts            # 通用工具函数
│   ├── pages/
│   │   ├── HomePage.tsx        # 编辑页（URL ↔ 状态同步）
│   │   ├── DocsPage.tsx        # Cron 语法参考
│   │   └── AboutPage.tsx       # 关于 / FAQ
│   ├── router.tsx
│   └── styles.css
├── biome.json
├── vite.config.ts
├── wrangler.jsonc          # Cloudflare Workers 配置
└── package.json
```

## 支持平台

crontab.cv 可生成以下平台可直接使用的配置：

| 平台 | 输出 |
|------|------|
| Linux / macOS crontab | 带环境变量与日志重定向的完整 crontab 文件 |
| Kubernetes CronJob | 包含 `timeZone` 与并发策略的 `cronjob.yaml` |
| GitHub Actions | `.github/workflows/schedule.yml`（自动转 UTC） |
| GitLab CI | `.gitlab-ci.yml` 定时流水线 |
| AWS EventBridge | 规则 JSON + AWS CLI 命令 |
| Vercel Cron | `vercel.json`（自动转 UTC） |
| Cloudflare Workers | `wrangler.toml` cron triggers |
| Spring `@Scheduled` | 6 字段 Quartz 表达式 Java 示例 |

## 贡献指南

欢迎贡献！你可以这样参与：

1. **Fork** 仓库
2. **创建** 功能分支（`git checkout -b feat/amazing-feature`）
3. **提交** 变更（`git commit -m 'feat: add amazing feature'`）
4. **推送** 到远端分支（`git push origin feat/amazing-feature`）
5. **发起** Pull Request

### 新增语言

1. 在 `messages/` 下新增语言文件（例如 `messages/ko.json`），可参考 `messages/en.json`。
2. 在 `project.inlang/settings.json` 的 `locales` 数组中加入语言代码。
3. 在 `LanguageSwitcher` 组件中加入对应语言选项。

## 许可证

本项目基于 **MIT License** 开源，详见 [`LICENSE`](LICENSE)。

## 致谢

- [cronstrue](https://github.com/bradymholt/cronstrue) — Cron 表达式自然语言描述
- [cron-parser](https://github.com/harrisiirak/cron-parser) — Cron 解析与下次执行时间计算
- [shadcn/ui](https://ui.shadcn.com) — 美观且可访问的 UI 组件
- [TanStack](https://tanstack.com) — 全栈 React 框架与路由
- [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — 类型安全 i18n

## 推荐其它项目

- [easing.tools](https://easing.tools) — CSS 缓动函数与动画节奏可视化工具。
- [rename.tools](https://rename.tools) — 基于规则的批量文件重命名工具。
- [open-awesome.com](https://open-awesome.com) — 面向开发者的开源工具与资源精选。

---

<p align="center">
  如果这个工具对你有帮助，欢迎在 <a href="https://github.com/chenz24/crontab.cv">GitHub</a> 上给个 ⭐！
</p>
