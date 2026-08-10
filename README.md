# Frankie — 厦门大学课程辅助系统

基于 LLM 的课程辅导知识库。将课程 Markdown 资料交给 Frankie 消化，师生即可随时提问检索。

`release` 分支在单人版基础上增加了**多用户支持**：一套系统服务整个班级（50–100 人），课程资料全班共享，个人知识库互相隔离。

**前置要求：** Python 3.11+、DeepSeek API Key

---

## 核心概念：双层知识库

| | 课程知识库（shared） | 个人知识库（users/{学号}） |
|---|---|---|
| 内容 | 课件、课本等教学材料 | 学生自己的笔记、资料、对话洞见 |
| 维护者 | 教师（admin）上传并摄取 | 学生本人 |
| 可见性 | 全班只读 | 仅本人 |
| 问答时 | 两层上下文合并，课程内容优先 | 同名 `[[页面]]` 个人库优先 |

提问、对话、Wiki 检索都会同时参考两层；引用角标点击可跳转到对应层的原文。

---

## 快速开始（本地开发 / 单人模式）

```bash
# 安装
git clone <repo-url>
cd Frankie
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[web]"

# 配置 API Key（项目根目录创建 .env）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 配置知识库路径（编辑 config/settings.toml）
[vault]
path = "D:/Study"               # 课程资料根目录
raw_sources_dir = "origin-sources"

# 启动
frankie web
```

浏览器打开 `http://localhost:7860`。

单人模式下 CLI 与测试行为与之前完全一致，无需任何迁移。

---

## 多用户部署（班级使用）

### 数据目录

由 `FRANKIE_DATA_DIR` 环境变量指定（默认 `./data`）：

```
data/
├── shared/                        # 课程共享库（admin 写，全班只读）
│   ├── origin-sources/            # 课件、课本原件
│   └── frankie-wiki/              # 摄取产物
└── users/{学号}/                  # 每个学生的个人库（严格隔离）
    ├── origin-sources/            # 学生上传的资料
    ├── frankie-wiki/              # 个人知识库
    └── .frankie/                  # 历史、摄取日志、Token 记账
```

首次访问自动建目录，无需手工初始化。

### 角色与权限

在 `config/settings.toml` 的 `[auth]` 段配置管理员名单：

```toml
[auth]
# data_dir = "./data"             # 也可用 FRANKIE_DATA_DIR 覆盖
admin_users = ["teacher01"]        # 管理员学号/工号
daily_token_limit = 50000          # 每用户每日 token 上限（管理员不限）
```

| 能力 | 学生 | 管理员 |
|---|---|---|
| 聊天 / 提问（合并双层知识库） | ✓（每日限额） | ✓（不限） |
| 浏览课程资料与课程 Wiki | ✓ 只读 | ✓ |
| 上传 / 摄取个人资料 | ✓ | ✓ |
| 上传 / 摄取课程资料（全班生效） | ✗ | ✓ |
| 系统设置、API 余额 | ✗ | ✓ |

### 教师维护课程资料

网页端以管理员身份登录后，在「文件库 → 课程资料」分组上传文件，点击 badge 摄取，全班立即可用。增量摄取按内容哈希去重，重复操作不产生额外开销。

### 认证接入（学校统一认证）

Frankie 不关心用户如何登录，只关心"已验证的身份"。认证是一个可插拔边界：

```
HTTP 请求 → resolve_user(request) → UserIdentity{学号, 角色} → 数据隔离 / 配额
```

- **后端**：实现 `src/frankie/auth.py` 中的 `resolve_user()` —— 校验学校 SSO 的 ticket/session，返回学号即可。下游的目录隔离、双层知识库、配额全部自动生效。
- **前端**：`frontend/src/api/client.ts` 中的 `authHeaders()` 是唯一注入点，在此改为携带 SSO 凭据。
- **当前实现**：dev provider（`X-Frankie-User` 请求头 + 侧边栏临时身份切换器），仅供本地开发联调，**上线前必须替换**。

---

## CLI 命令

```bash
frankie                  # 进入对话
frankie chat             # 同上
frankie status           # 查看状态、余额、Token 消耗
frankie sources          # 列出原始资料及摄取状态
frankie lint             # Wiki 健康检查

frankie ingest "文件.md"          # 摄取单文件
frankie ingest "目录/" -r         # 递归摄取目录
frankie ingest "文件.md" -f       # 强制重摄

frankie query "问题"              # 基于知识库提问
frankie query "问题" --archive    # 提问并归档答案
frankie query "问题" --reason     # 深度推理模式

frankie-smoke            # 运行烟雾测试
```

---

## 目录结构

单用户 Vault（CLI / 本地开发）：

```
你的Vault/
├── frankie-wiki/           # Wiki（Frankie 自动生成）
│   ├── sources/            # 资料摘要
│   ├── insights/           # 对话洞见
│   ├── queries/            # 查询归档
│   └── index.md            # 索引
└── origin-sources/         # 原始课程资料（你来放）
    ├── 数学/
    │   └── 微积分笔记.md
    └── ...
```

多用户部署的数据目录见上文「多用户部署」一节。

---

## 配置

`config/settings.toml`：

```toml
[vault]
path = "path/to/your/references"   # 课程资料根目录（单人模式）
wiki_dir = "frankie-wiki"          # Wiki 目录名
raw_sources_dir = "origin-sources"

[llm]
default_model = "deepseek-v4-flash"
reasoning_model = "deepseek-v4-pro"
max_tokens = 8192
temperature = 0.7

[auth]
admin_users = ["teacher01"]        # 管理员名单（多用户模式）
daily_token_limit = 50000          # 每用户每日 token 上限
```

## 环境变量

Frankie 的 `.env` 仅用于机密信息：

- `DEEPSEEK_API_KEY`：DeepSeek / Anthropic API 密钥。

其余配置优先从 `config/settings.toml` 加载，必要时可通过环境变量覆盖：

- `FRANKIE_DATA_DIR`：多用户数据根目录，默认 `./data`。
- `FRANKIE_VAULT_PATH`：单用户知识库根目录。
- `FRANKIE_VAULT_WIKI_DIR`：Wiki 子目录名。
- `FRANKIE_VAULT_RAW_SOURCES_DIR`：原始资料子目录名。
- `FRANKIE_LLM_BASE_URL`：LLM 接口地址。
- `FRANKIE_LLM_DEFAULT_MODEL`：默认会话模型。
- `FRANKIE_LLM_REASONING_MODEL`：深度推理模型。

## 数据库与持久化

Frankie 使用 SQLite 作为本地记忆和历史存储后端。

- 数据库文件路径：`<vault>/.frankie/memory.db`
- 每个用户 / 课程共享库都有各自独立的 `.frankie` 目录。
- 不需要额外的数据库环境变量，路径由 `VaultContext` 根据当前数据目录自动创建。

## 编辑个人 Wiki

查看 `config/_index.example.md` 按照相关说明编辑个人 Wiki 文件夹 index.md。
