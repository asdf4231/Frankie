# Nemsy MVP 设计文档

> 版本：v0.1-design  
> 理念来源：Andrej Karpathy — LLM as Wiki Maintainer  
> 目标：用最小代价构建一个**可真实使用**的个人知识助理 CLI

---

## 一、核心理念

```
原始资料（Raw Sources）
        ↓  LLM 消化
  Wiki（知识精华层）
        ↓  LLM 检索
      对话 / 查询
```

LLM 不是搜索引擎，是**知识库的维护者**。  
Wiki 不是笔记的镜像，是**思想的精选提炼**。  
原始资料只读，Wiki 由 Nemsy 负责写。

---

## 二、三层架构

```
┌─────────────────────────────────────────────┐
│  Layer 3：Schema 层                          │
│  AGENTS.md — 存于 Vault，定义写作规范         │
│  config/settings.toml — 路径、模型、行为配置  │
└─────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────┐
│  Layer 2：Wiki 层（nemsy-wiki/）              │
│  由 Nemsy 负责写入，用户只读                  │
│  sources/   → 摄取摘要页面                   │
│  entities/  → 人物、组织、概念                │
│  concepts/  → 抽象知识节点                   │
│  queries/   → 查询归档                       │
│  index.md   → 全局入口                       │
│  log.md     → 操作日志                       │
└─────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────┐
│  Layer 1：原始资料层（origin-sources/）       │
│  用户手动维护，Nemsy 只读不写                 │
│  白名单扫描（scan_dirs = ["origin-sources"]） │
└─────────────────────────────────────────────┘
```

---

## 三、文件生命周期设计

### 3.1 问题

Obsidian 没有原生 UID。文件存在以下几种状态，当前 ingest log 无法区分：

```
空文档（占位）→ 有内容（初稿）→ 修改（内容更新）→ 成熟（稳定）
```

### 3.2 解决方案：基于路径 + SHA-256 哈希的状态机

**主键策略**：绝对路径字符串（零侵入，不改写用户文件）  
**变化检测**：文件内容 SHA-256 哈希

### 3.3 文件状态定义

| 状态 | 触发条件 | 处理动作 |
|---|---|---|
| `empty` | 内容为空（strip 后长度为 0）| 写入/更新 log，跳过 LLM，打印提示 |
| `done` | 已摄取，hash 未变 | 跳过（最新） |
| `changed` | 已摄取，hash 有变化 | 重新摄取 → 更新 Wiki |

> **"不在 log 中"即首次发现**：无需单独的 `pending` 状态，`not in log → 执行 ingest` 即可。

### 3.4 ingest_log.json 结构

```json
{
  "version": 2,
  "files": {
    "/绝对路径/文件.md": {
      "hash": "当前sha256hex",
      "prev_hash": "上一次sha256hex 或 null",
      "size": 2048,
      "status": "empty | done | changed",
      "ingest_mode": "quick | full | null",
      "ingested_at": [
        "2026-06-01T10:00:00",
        "2026-06-09T15:00:00"
      ],
      "wiki_page": "sources/文件名-2026-06-01.md 或 null"
    }
  }
}
```

**字段说明：**

| 字段 | 说明 |
|---|---|
| `hash` | 当前内容的 SHA-256，空文件为固定值 `e3b0c4...` |
| `prev_hash` | 上一次摄取时的 hash，用于追溯变化；首次为 null |
| `size` | 文件字节数，辅助快速判断是否为空 |
| `status` | 当前状态，见 3.3 |
| `ingest_mode` | 本次摄取使用的模式：`quick`（轻量）或 `full`（精摄取）；`empty` 时为 null |
| `ingested_at` | 时间戳数组，每次摄取追加一条；`[-1]` 是最近一次，长度即摄取次数 |
| `wiki_page` | 反向映射：原始资料 → Wiki 摘要页路径，为后续"精摄取更新"功能铺路 |

> **不设 `ingest_count` 字段**：`len(ingested_at)` 即摄取次数，不重复存储。

### 3.5 状态转移图

```
[发现文件]
    │
    ├─ 内容为空（strip 后长度 0）
    │       └─→ status: empty，写入/更新 log，跳过 LLM，打印提示
    │
    ├─ 不在 log 中（首次发现，有内容）
    │       └─→ 执行 ingest → 写入 Wiki → 更新 log（status: done）
    │
    ├─ 在 log 中，hash 相同
    │       └─→ status: done，跳过（无需更新 log）
    │
    └─ 在 log 中，hash 不同
            └─→ status: changed → 执行 ingest → 更新 Wiki → 更新 log（status: done）
                （prev_hash ← 旧 hash，hash ← 新 hash，ingested_at 追加新时间戳）

[--force 标志]
    → 强制将 done 状态也触发 ingest，但 empty 依然只更新 log 不走 LLM
```

> **核心约束：无论 quick 还是 full 模式，只要执行了 ingest，都必须更新 ingest_log。**  
> ingest_log 是文件状态的唯一真相，模式不影响记录义务。

---

## 四、CLI 命令设计

### 4.1 命令全集

```
nemsy                              # 默认进入 chat 模式
nemsy chat                         # 同上，显示 REPL 界面

nemsy ingest                       # 扫描全部 origin-sources/（quick 模式，有确认提示）
nemsy ingest <PATH>                # 摄取文件（full 模式）或目录一层（quick 模式）
nemsy ingest <PATH> -r             # 穿透子目录递归摄取（quick 模式）
nemsy ingest <PATH> -f             # 强制重摄取（忽略 done 状态，模式规则不变）
nemsy ingest <PATH> --deep         # 强制使用 full 模式（目录/批量时也精摄取）
nemsy ingest <PATH> --dry-run      # 预览待处理文件，不执行
nemsy ingest -r --dry-run          # 预览全部 origin-sources/ 下待处理文件，不执行

nemsy query <问题>                 # 向 Wiki 提问（基于当前 Wiki 内容）
nemsy query <问题> -a              # 同上，并将答案归档为 Wiki 页面
nemsy query <问题> -r              # 使用深度推理模型（deepseek-v4-pro）

nemsy lint                         # Wiki 健康检查（矛盾/孤立页面/缺失链接）
nemsy status                       # 显示 Vault/Wiki/LLM 状态
nemsy sources                      # 列出 origin-sources 目录结构和文件状态
```

### 4.2 摄取模式自动选择规则

`-r` 控制"穿多深"，`--deep` 控制"用多少力"，两个维度正交，互不干扰。

| 输入类型 | 默认模式 | `--deep` 覆盖 |
|---|---|---|
| 无路径 `ingest` | **quick**（轻量注册） | `--deep` → full |
| 单文件 `ingest <file>` | **full**（精摄取） | 无需，已是 full |
| 目录 `ingest <dir>` | **quick**（轻量注册） | `--deep` → full |
| 目录递归 `ingest <dir> -r` | **quick**（轻量注册） | `--deep` → full |

**quick 模式**（目录输入默认）：
- Wiki 上下文：只加载 `index.md`（避免重复传全量）
- 输出目标：结构化摘要页（title / tags / 核心观点 / 关键词）
- Frontmatter 标记：`ingest_mode: quick`
- 适合：大批导入、初步建立覆盖面

**full 模式**（单文件默认，`--deep` 强制）：
- Wiki 上下文：加载最近 30 页（找关联、发现矛盾）
- 输出目标：摘要页 + 需更新的关联页面 + 值得深究的问题
- Frontmatter 标记：`ingest_mode: full`
- 适合：核心文献、重要笔记、需要深度整合的内容

> **lint 命令可识别 `ingest_mode: quick` 的页面，提示用户对重要文件补做精摄取。**

### 4.3 路径解析规则（ingest）

```
传入路径
  │
  ├─ 未传（None 或空字符串）
  │       └─→ 使用 raw_sources_path（origin-sources/ 根目录）
  │             非 --dry-run 且待处理文件 > 20 时，显示确认提示：
  │             「No path specified, scanning all of origin-sources/ (N files). Continue? [y/N]」
  │
  ├─ 绝对路径 → 直接使用
  │
  └─ 相对路径
        ├─ raw_sources_path / 相对路径 存在？→ 使用（以 origin-sources 为根）
        └─ 不存在 → 回退到 cwd / 相对路径
```

### 4.4 chat 内联命令

```
/ingest <路径> [-r] [-f] [--deep] [--dry-run]
/query <问题>
/sources
/lint
/status
/help
/quit
```

---

## 五、核心模块职责

```
src/nemsy/
├── cli.py        CLI 入口，命令解析，调用 agent 和 vault
├── agent.py      三大核心操作：ingest / query / lint
│                 + chat_turn（REPL 单轮）
├── vault.py      Vault 读写，ingest_log 状态机，collect_files
├── llm.py        LLM 封装（chat / chat_stream / reason）
└── config.py     配置加载（settings.toml + .env）

config/
└── settings.toml  路径、模型、行为配置

.nemsy/            运行时数据（.gitignore 已排除）
├── ingest_log.json  文件状态记录
├── history/         对话历史（待实现）
└── cache/           摘要缓存（待实现）
```

---

## 六、ingest 工作流（详细）

```
nemsy ingest <PATH>
        │
        ▼
collect_files(path, recursive)
  → 过滤黑名单目录（.venv/.git/.obsidian 等）
  → 返回 [Path, ...]
        │
        ▼
for each file:
  ├─ read content → strip
  ├─ content 为空？→ 记录 empty，跳过，打印 [dim]
  │
  ├─ 计算 sha256(content)
  ├─ 查 ingest_log[path]
  │     ├─ 不存在 → pending
  │     ├─ hash 相同 → done，跳过（除非 --force）
  │     └─ hash 不同 → changed
  │
  └─ 执行 agent.ingest(content, title)
        ├─ 调用 LLM，生成 SUMMARY / UPDATES / QUESTIONS
        ├─ write_wiki_note("sources/xxx.md")
        ├─ update_index()
        └─ record_ingest(path, hash, wiki_page)  ← 写回 log
```

---

## 七、query 工作流（详细）

```
nemsy query <问题>
        │
        ▼
_load_wiki_context(max_files=30)
  → 优先加载 index.md
  → 按修改时间倒序加载其余页面
        │
        ▼
LLM（_QUERY_SYSTEM prompt）
  → 综合多页面内容
  → 答案末尾标注引用来源 [[页面名]]
  → 如有归档价值，标注 ARCHIVABLE: true
        │
        ▼
如果 --archive 或检测到 ARCHIVABLE:
  → write_wiki_note("queries/xxx.md")
  → update_index()
```

---

## 八、当前已实现 vs 待实现

### 已实现 ✓
- [x] CLI 框架（click + rich）
- [x] chat REPL（流式输出，历史裁剪）
- [x] ingest 单文件
- [x] ingest 目录批量（含进度条）
- [x] ingest --recursive / --force / --dry-run
- [x] 相对路径解析（以 raw_sources 为根）
- [x] 黑名单目录过滤（.venv/.git 等）
- [x] 布尔型 ingest_log（已摄取/未摄取）
- [x] query（流式 + 归档）
- [x] query --reason（深度推理模式）
- [x] lint（Wiki 健康检查）
- [x] status（状态总览）
- [x] sources（原始资料目录树）
- [x] Wiki 写入（sources/entities/concepts/queries 子目录）
- [x] index.md 自动更新
- [x] log.md 操作记录
- [x] Anthropic SDK（DeepSeek 兼容协议，为 MCP 铺路）

### 待实现（MVP 核心缺口）
- [ ] **ingest_log 升级**：布尔值 → 状态机（empty/done/changed），含 SHA-256、`prev_hash`、`ingested_at` 数组、`ingest_mode`、`wiki_page`
- [ ] **哈希变化检测**：SHA-256，自动识别 `changed` 文件，空文件直接记录 `empty` 跳过 LLM
- [ ] **ingest quick/full 双模式**：目录输入默认 quick（只传 index.md），单文件默认 full，`--deep` 强制 full
- [ ] **`_index.md` 目录语境支持**：每个目录下可放一个 `_index.md` 作为该目录的主题概述；`collect_files()` 将其**从返回列表中排除**（不参与摄取流程、不进 ingest_log、不生成 Wiki 摘要页）；ingest 批量处理该目录时，单独读取 `_index.md` 内容作为上下文前缀注入同目录其他文件的 prompt（替代旧的 `__init__.md` 命名）
- [ ] **wiki_page 反向映射**：原始资料 → Wiki 摘要页，`ingest_mode` 写入摘要页 frontmatter
- [ ] **对话历史持久化**：chat 记录写入 `.nemsy/history/`
- [ ] **sources 命令显示文件状态**：在目录树旁标注 empty/done/changed/ingested_at

### lint 增强（MVP 内，纯 Python 实现，不依赖外部工具）
- [ ] **`backlinks()`**：扫描 Wiki 全部 `.md`，解析所有 `[[链接]]`，构建反向索引（谁链接了某页）；供 lint 识别孤立页面
- [ ] **`unresolved_links()`**：扫描 Wiki 全部 `[[链接]]`，对比实际存在的文件名，返回悬空链接列表；供 lint 发现断链

> 两者均基于正则 + Path，零外部依赖，不要求 Obsidian 进程运行，可移植到任意 Markdown 存储。

### 超出 MVP 范围（未来迭代）
- [ ] Function Calling（自然语言触发 ingest/sources）
- [ ] 向量检索（替代全文 context 注入）
- [ ] Wiki 页面自动更新（changed 时 diff 并合并，而非覆盖）
- [ ] 文件重命名/移动的 log 迁移
- [ ] Web UI
- [ ] **Token 消耗统计模块**：跟踪每次 LLM 调用的 token 用量（prompt / completion / 总计），支持按命令/按文件/按时间段汇总；具体设计待定

---

## 九、MVP 完成标准

满足以下条件即为 MVP 完成：

1. **ingest 可靠**：空文件跳过，已处理文件跳过，改动文件自动重摄取
2. **Wiki 可生长**：每次 ingest 都能在 Wiki 中留下有意义的痕迹（摘要页 + index 更新）
3. **query 可用**：能基于 Wiki 回答问题，答案有来源引用
4. **状态可观测**：`status` 和 `sources` 命令能清晰展示当前状态
5. **不崩溃**：路径含空格、空文件、网络超时等边界情况不 crash
