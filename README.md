# Frankie — 厦门大学课程辅助系统

基于 LLM 的课程辅导知识库。将课程 Markdown 资料交给 Frankie 消化，师生即可随时提问检索。

`release` 分支在单人版基础上增加了**多用户支持**：一套系统服务整个班级（50–100 人），课程资料全班共享，个人知识库互相隔离。

**前置要求：** Python 3.11+、DeepSeek API Key

---

## 核心概念：双层知识库

| | 课程知识库（独立仓库的 llm_wiki） | 个人知识库（users/{学号}） |
|---|---|---|
| 内容 | 课件、课本等教学材料 | 学生自己的笔记、资料、对话洞见 |
| 维护者 | 教师在课程 Git 仓库维护，部署时拉取 | 学生本人 |
| 可见性 | 全班只读 | 仅本人 |
| 问答时 | 两层上下文合并，课程内容优先 | 同名 `[[页面]]` 个人库优先 |

课程 Wiki 从独立仓库的 `llm_wiki` 读取，引用角标可跳转到原文。

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

# 拉取课程 Wiki
git clone --filter=blob:none --no-checkout git@github.com:JunnanZ/dynamic_optimization_2026.git ../course
git -C ../course sparse-checkout set --no-cone '/llm_wiki/' '!**/slides/'
git -C ../course checkout master

# 构建前端并启动
(cd frontend && pnpm install --frozen-lockfile && pnpm build)
frankie web
```

浏览器打开 `http://localhost:7860`。

默认仅监听本机；需要局域网访问时显式传入 `--host 0.0.0.0`。CLI 个人 Vault 仍由 `[vault]` 配置。

---

## 多用户部署（班级使用）

部署方式见 [deploy/README.md](deploy/README.md)：一个部署脚本、systemd 用户服务、现有 Caddy 反代。

- `FRANKIE_COURSE_WIKI_PATH` 指向独立课程仓库的 `llm_wiki`，默认项目旁的 `../course/llm_wiki`。
- `index.md` 是目录，`faq.md` 提供课程信息，主题目录是概念 Wiki。
- `raw/` 中的 Markdown 讲义在文件库的「课件」页展示，主题页面在「Wiki」页展示。
- 更新课程仓库后，下次读取立即使用新内容。
- `FRANKIE_DATA_DIR` 保存账号、个人资料和历史，与两个 Git 仓库分开。

认证使用本地账号密码和签名会话 Cookie。管理员可查看系统设置和余额。账号保存在 `data/auth/users.json`。

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
default_model = "deepseek-flash"
reasoning_model = "deepseek-v4-pro"
max_tokens = 8192
temperature = 0.7

[auth]
admin_users = ["teacher01"]        # 管理员名单（多用户模式）
daily_token_limit = 50000          # 每用户每日 token 上限
```

## 环境变量

Frankie 的 `.env` 仅用于机密信息：

- `DEEPSEEK_API_KEY`：DeepSeek API 密钥。
- `FRANKIE_AUTH_SECRET`：会话签名密钥。

其余配置优先从 `config/settings.toml` 加载，必要时可通过环境变量覆盖：

- `FRANKIE_DATA_DIR`：多用户数据根目录，默认项目内的 `data`。
- `FRANKIE_COURSE_WIKI_PATH`：独立课程仓库的 `llm_wiki` 绝对路径。
- `FRANKIE_VAULT_PATH`：单用户知识库根目录。
- `FRANKIE_VAULT_WIKI_DIR`：Wiki 子目录名。
- `FRANKIE_VAULT_RAW_SOURCES_DIR`：原始资料子目录名。
- `FRANKIE_LLM_BASE_URL`：LLM 接口地址。
- `FRANKIE_LLM_DEFAULT_MODEL`：默认会话模型。
- `FRANKIE_LLM_REASONING_MODEL`：深度推理模型。

## 数据库与持久化

Frankie 使用 SQLite 作为本地记忆和历史存储后端。

- 数据库文件路径：`<vault>/.frankie/memory.db`
- 每个用户的历史和个人记忆存放在独立的 `.frankie` 目录。
- 不需要额外的数据库环境变量，路径由 `VaultContext` 根据当前数据目录自动创建。

## 编辑个人 Wiki

查看 `config/_index.example.md` 按照相关说明编辑个人 Wiki 文件夹 index.md。
