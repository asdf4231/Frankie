# Frankie 课程辅助系统设计文档

> 版本：v0.2
> 目标：为高校课程辅助场景提供一个基于本地知识库、共享课程资料与个人记忆的严谨系统设计。

---

## 1. 背景与目标

Frankie 的目标是将课程教材、讲义与学生个人笔记转化为“可检索、可引用、可解释”的知识资产。系统必须同时满足：

- **学术性**：输出结果应明确标注来源类型、避免主观臆断。
- **可追溯性**：每次摄取和查询行为均有本地持久化记录。
- **隔离性**：课程共享资料与个人学习内容严格隔离，保护学生隐私。
- **可配置性**：仅将机密信息放入 `.env`，其余参数通过 `config/settings.toml` 或环境变量加载。

---

## 2. 数据与权限模型

### 2.1 数据层次

```
data/
├── shared/                      # 课程共享库（管理员写，全班只读）
│   ├── origin-sources/          # 课本、课件、讲义原件
│   ├── frankie-wiki/            # 共享课程摘要与索引
│   └── .frankie/                # 共享级 SQLite 与日志
└── users/{user_id}/             # 学生个人库（严格隔离）
    ├── origin-sources/          # 个人资料与笔记
    ├── frankie-wiki/            # 个人 Wiki 与查询归档
    └── .frankie/                # 个人 SQLite 与元数据
```

### 2.2 角色与权限

- `admin`：教师或课程维护者，可写共享课程库、发布共享记忆。
- `student`：学生用户，仅可读共享课程库，可写个人学习库。

权限控制通过 `src/frankie/auth.py` 实现，`resolve_user()` 是唯一认证插拔点。

---

## 3. 系统架构

### 3.1 主要模块

- `config/settings.toml`：主体配置文件，定义路径、模型与权限参数。
- `.env`：仅保存 `DEEPSEEK_API_KEY` 等机密密钥。
- `src/frankie/config.py`：统一加载 `.env` 与 `settings.toml`，支持环境变量覆盖。
- `src/frankie/vault.py`：管理 Vault 路径、raw source 扫描与 Wiki 写入。
- `src/frankie/memory.py`：SQLite 本地存储层，保存对话历史、个人记忆与共享记忆。
- `src/frankie/agent.py`：LLM 交互与 prompt 生成核心。
- `src/frankie/web.py`：Web API 层，绑定认证与多用户上下文。

### 3.2 资料流

原始资料 → LLM 摄取 → Wiki 摘要 + 索引

查询时：Wiki 内容 + 个人记忆 + 公共记忆 → 生成回答。

---

## 4. 配置与环境变量

### 4.1 `.env` 目的

`.env` 仅用于机密信息。目前仅需：

- `DEEPSEEK_API_KEY`

### 4.2 其他可覆盖项

其余配置优先读取 `config/settings.toml`，可选环境变量覆盖如下：

- `FRANKIE_DATA_DIR`
- `FRANKIE_VAULT_PATH`
- `FRANKIE_VAULT_WIKI_DIR`
- `FRANKIE_VAULT_RAW_SOURCES_DIR`
- `FRANKIE_LLM_BASE_URL`
- `FRANKIE_LLM_DEFAULT_MODEL`
- `FRANKIE_LLM_REASONING_MODEL`

### 4.3 数据库路径

Frankie 使用 SQLite，本地数据库文件由运行时上下文自动创建：

- `<vault>/.frankie/memory.db`

因此无需额外数据库环境变量或连接字符串。

---

## 5. 存储策略

### 5.1 原始资料

- 保留 Markdown 源文档，不直接修改。
- 依据目录路径判断来源类别（课本 / 课件 / 资料）。

### 5.2 Wiki 摘要

- 由 LLM 生成并写入 `frankie-wiki/`。
- 应以学术性摘要为主，避免照抄原文。

### 5.3 本地持久化

- `memory.db`：保存对话会话、消息、个人记忆与公共记忆。
- `.frankie/ingest_log.json`：保存原始资料摄取状态与哈希。

---

## 6. 生成规范

摄取与回答过程中，系统应明确传递：

- 资料标题
- 来源类型（课本 / 课件 / 资料）
- 当前索引上下文
- 当前 Wiki 语境

生成结果须包含来源说明，例如“参考课本”或“参考课件”，并避免主观推断。

---

## 7. 运行要点

- `.env` 只存密钥，配置文件与运行目录分离。
- SQLite 路径由 Vault 自动派生，不依赖外部数据库服务。
- 设计文档仅保留本文件，避免分散维护。 
