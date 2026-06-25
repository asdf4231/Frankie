# 奈姆希（Nemsy）：一个自我构建的私人知识助理

> 名字取自炉石传说中的 Nemsy Necrofizzle —— 聪明、好奇、充满能量。

本项目基于 Karpathy 的 LLM Wiki 理念，由 DeepSeek 超长上下文模型驱动，以 Obsidian Vault 为知识源，为唯一用户提供持续积累、自主归纳的个人知识服务。

---
<table><tr>
<td><img src="design/Nemsy_Necrofizzle_HS.webp" alt="Nemsy Necrofizzle" width="160" /></td>
<td><img src="design/qrcode_1782021903468.jpg" alt="QQ群" width="160" /></td>
</tr></table>


## Web效果
![Nemsy Web](design/screen-shot.png "Nemsy Web")

## 目录结构

```
Nemsy/
├── src/nemsy/
│   ├── __init__.py
│   ├── cli.py          # CLI 入口（click + rich）
│   ├── web.py          # Web 后端（FastAPI + SSE 接口）
│   ├── agent.py        # Agent 核心：ingest / query / lint / chat / save
│   ├── vault.py        # Obsidian Vault 读写操作
│   ├── llm.py          # DeepSeek API 封装（流式 / 普通 / 推理 / 余额查询）
│   └── config.py       # 统一配置加载（.env + settings.toml）
├── frontend/           # React 前端（Vite + TypeScript，Obsidian 风格）
├── config/
│   └── settings.toml   # 项目配置（Vault 路径、模型、CLI 等）
├── tests/
├── .catpaw/
│   └── rules           # Vibe coding 规则（AI 协作约定）
├── .env                # 密钥（不进 git）
├── .env.example        # 密钥模板
└── pyproject.toml      # 包配置与依赖管理
```

Obsidian Vault 内由 Nemsy 管理的目录：

```
Obsidian Vault/
├── nemsy-wiki/             # Wiki 层（由 LLM 写，你来读）
│   ├── index.md            # 内容索引（自动维护）
│   ├── log.md              # 操作日志（仅追加）
│   ├── sources/            # 摄取资料的摘要页面
│   ├── insights/           # /save 命令归档的对话洞见
│   ├── queries/            # 有价值的查询结果归档
│   ├── entities/           # 实体页面（人物、项目、工具）
│   └── concepts/           # 概念页面（理论、方法论）
└── origin-sources/         # 原始资料层（只读，你来维护）
    ├── 某个主题/
    │   ├── _index.md       # 摄取指导（可选，告诉 LLM 如何处理本目录）
    │   └── 文章.md
    └── ...
```

---

## 快速开始

**前置要求：** Python 3.11+、DeepSeek API Key（[免费注册](https://platform.deepseek.com/)）

### 第一步：克隆并安装

```bash
git clone <repo-url>
cd Nemsy

# 创建虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows PowerShell

# 安装 Nemsy（含 Web UI 依赖）
pip install -e ".[web]"
```

### 第二步：填写两个配置

**① API Key**（`.env` 文件，项目根目录）

```bash
cp .env.example .env
```

用任意文本编辑器打开 `.env`，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**② Vault 路径**（`config/settings.toml`）

打开 `config/settings.toml`，修改 `[vault]` 部分，填写你的知识库根目录路径和原始资料子目录名：

```toml
[vault]
path = "/Users/你的用户名/path/to/my-knowledge"   # 任意本地文件夹，无需 Obsidian
raw_sources_dir = "origin-sources"                 # 原始资料放在这个子目录里
```

> **path 可以是任意文件夹**，不依赖 Obsidian。Nemsy 会在其中自动创建 `nemsy-wiki/` 子目录写入 Wiki，原始资料放在你指定的 `raw_sources_dir` 子目录里即可。
>
> **macOS 权限提示（Vault 在 iCloud / OneDrive 同步目录时）：** 系统设置 → 隐私与安全性 → 完全磁盘访问权限 → 添加终端应用并开启
>
> **Windows 路径格式：** 使用正斜杠 `C:/Users/你的用户名/Documents/my-knowledge` 或双反斜杠 `C:\\Users\\...`

### 第三步：启动

```bash
nemsy web
```

自动打开浏览器 `http://localhost:7860`，Ctrl+C 停止。

```bash
nemsy web --port 8080   # 自定义端口
nemsy web --no-open     # 不自动打开浏览器
```

---

## Web UI

提供四个视图：

| 视图 | 功能亮点 |
|------|----------|
| **Chat** | 流式对话 + Chat/Wiki 双模式切换（切换时居中 Toast 介绍模式特点）；Assistant 回答气泡右下角有归档按钮，一键将该条回答归档为洞见（不可重复） |
| **文件库** | Sources/Wiki 双栏；Sources 中「未摄取」/「已更新」badge 可点击，弹出确认框后触发单文件摄取，结果实时更新 |
| **状态** | Vault/Wiki/LLM 状态卡片；Token 消耗按指令/模型分布；DeepSeek API 余额异步加载 |
| **设置** | `settings.toml` + `.env` 只读展示；敏感 Key 自动脱敏；未配置时显示首次引导 |

---

## CLI 使用

### 查看状态

```bash
nemsy status
```

显示 Vault 路径、Wiki 页面统计、LLM 配置、DeepSeek 账户余额，以及 Token 消耗摘要（累计调用次数、总 token、按指令/模型分布）。

---

### 对话模式（默认）

```bash
nemsy
# 或
nemsy chat
```

进入持续对话，Wiki 作为主要知识来源。支持以下内联命令：

| 命令 | 说明 |
|------|------|
| `/ingest <路径>` | 摄取文件或目录进 Wiki（支持 `-r` 递归、`-f` 强制重摄） |
| `/query <问题>` | 向 Wiki 精准提问（不进入历史记忆） |
| `/query <问题> -a` | 精准提问并将答案归档到 `queries/` |
| `/save <主题>` | 将当前对话整理为洞见，归档到 `insights/` |
| `/lint` | 运行 Wiki 健康检查 |
| `/sources` | 列出原始资料层所有文件，标注摄取状态（new/done/changed/empty）和最近摄取日期 |
| `/status` | 查看当前状态 |
| `/help` | 显示帮助 |
| `/quit` | 退出 |

---

### 摄取资料

```bash
# 摄取单个文件
nemsy ingest "/path/to/article.md"

# 递归摄取整个目录
nemsy ingest "/path/to/folder" -r

# 强制重新摄取（忽略已处理记录）
nemsy ingest "/path/to/article.md" -f

# 宽模式（加载更多 Wiki 上下文，发现更多交叉引用）
nemsy ingest "/path/to/article.md" --wide

# 预演模式（不实际写入，仅显示待处理文件）
nemsy ingest "/path/to/folder" -r --dry-run
```

LLM 会提取关键信息、生成结构化摘要，自动写入 `sources/` 子目录，同时更新 `index.md`。

**摄取指导（`_index.md`）**：在原始资料子目录下放置 `_index.md`，可向 LLM 说明该目录的领域定位、推荐 Tags、摄取重点等，LLM 会在摄取时优先参考。

---

### 提问查询

```bash
nemsy query "LLM Wiki 的核心理念是什么？"

# 归档答案为 Wiki 页面
nemsy query "如何构建个人知识体系？" --archive

# 使用深度推理模型（复杂问题）
nemsy query "分析一下这几篇文章的共同主题" --reason
```

---

### 查看原始资料状态

```bash
nemsy sources
```

展示原始资料目录树，每个文件附带摄取状态标注：

| 状态 | 含义 |
|------|------|
| `new` | 从未摄取 |
| `done 06-17` | 已摄取，附最近摄取日期 |
| `changed 06-17` | 文件已修改，建议重新摄取 |
| `empty` | 文件为空，自动跳过 |

---

### Wiki 健康检查

```bash
nemsy lint
```

语义级审计：检查 Wiki 中的逻辑矛盾、过时观点、孤立页面、缺失引用等问题，并给出改进建议。

---

### 运行测试

```bash
# 快速烟雾测试（验证核心功能）
nemsy-smoke

# 或使用 pytest
pytest tests/test_smoke.py -v -s
```

**注意**：测试会调用真实 LLM API 并生成 Wiki 内容，完成后需手动清理测试文件。

---

## 配置说明

`config/settings.toml` 主要配置项：

```toml
[vault]
path = ""                    # 知识库根目录路径，任意本地文件夹（必填）
wiki_dir = "nemsy-wiki"      # Wiki 子目录名（Nemsy 负责写入）
raw_sources_dir = ""         # 原始资料子目录名（你负责维护）
raw_sources_ignore = []      # 不需要摄取的子目录黑名单

[llm]
default_model = "deepseek-v4-flash"    # 日常对话模型
reasoning_model = "deepseek-v4-pro"    # 深度推理模型（--reason 时使用）
max_tokens = 8192
temperature = 0.7
```

`.env` 密钥配置（不进 git）：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```
