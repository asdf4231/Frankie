# Frankie — 厦门大学课程辅助系统

基于 LLM 的课程问答助手。师生可以检索课程 Wiki、阅读讲义，并通过对话提问。

一套系统服务整个班级（50–100 人），课程资料全班共享，附件和对话历史互相隔离。

**前置要求：** Python 3.14（`.python-version` 固定）、Node 24.19.0（pnpm 自动获取）、pnpm 11+、uv、DeepSeek API Key

---

## 课程问答

课程 Wiki 从独立 Git 仓库的 `llm_wiki` 读取，由教师在课程仓库维护。

- 对话通过章节级 BM25 检索和整页阅读获取依据，返回保留 Markdown 段落、公式和代码的原文摘录。
- 文件库和聊天引用支持跳转到 Wiki、讲义中的具体章节，并保留浏览历史位置。
- 对话支持图片和文档附件，并自动保存历史。

---

## 快速开始（本地开发 / 单人模式）

```bash
# 安装（按 uv.lock / pnpm-lock.yaml 安装锁定版本）
# uv 不要装进项目 .venv：uv sync 会重建与项目不匹配的 .venv，把里面的工具一起删掉
git clone <repo-url>
cd Frankie
uv sync --extra web
pnpm --dir frontend install --frozen-lockfile

# 配置 API Key（项目根目录创建 .env）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 拉取课程 Wiki
git clone --filter=blob:none --no-checkout git@github.com:JunnanZ/dynamic_optimization_2026.git ../course
git -C ../course sparse-checkout set --no-cone '/llm_wiki/' '!**/slides/'
git -C ../course checkout master

# 构建前端并启动
pnpm --dir frontend build
uv run frankie rebuild-wiki-index
uv run frankie web
```

浏览器打开 `http://localhost:7860`。

默认仅监听本机；需要局域网访问时显式传入 `--host 0.0.0.0`。CLI 查询的 Vault 由 `[vault]` 配置。

---

## 多用户部署（班级使用）

部署方式见 [deploy/README.md](deploy/README.md)：一个部署脚本、systemd 用户服务、现有 Caddy 反代。

- `FRANKIE_COURSE_WIKI_PATH` 指向独立课程仓库的 `llm_wiki`，默认项目旁的 `../course/llm_wiki`。
- `index.md` 是目录，`faq.md` 提供课程信息，主题目录是概念 Wiki。
- `raw/` 中的 Markdown 讲义在文件库的「课件」页展示，主题页面在「Wiki」页展示。
- 部署更新课程仓库、构建前端和共享检索索引，再重启服务；本地修改 Wiki 后运行 `frankie rebuild-wiki-index`。
- `FRANKIE_DATA_DIR` 保存账号、个人资料、历史和共享检索索引，与两个 Git 仓库分开。

认证使用本地账号密码和签名会话 Cookie。管理员可查看系统设置、余额和学习情况。账号、显示名称、角色和加盐密码哈希保存在 `data/auth/users.json`，由服务器管理员维护。

## Wiki 检索

Chat 预载 `faq.md` 中 `## Frequently Asked Questions in Dynamic Optimization` 之前的课程信息作为参考资料；详细 FAQ 和其他 Wiki 内容由模型在静默准备阶段决定何时检索或阅读。检索和阅读进度单独展示；准备完成后，独立生成最终回答并实时流式显示。`search_wiki` 使用 SQLite FTS5、英文 Porter 词干和章节级加权 BM25，忽略常见英文问句词。相关 FAQ 条目优先返回完整答案，并按条目保留多个匹配问答；普通 Wiki 随后返回，每页只保留最佳章节。两类内部均先匹配全部查询词，结果不足时匹配部分词；FAQ 依据章节标题和正文匹配，不靠整页标题命中。显式 `topic` 仍限定检索范围。默认检索概念 Wiki；`topic="raw"` 检索讲义。根目录 `index.md` 和 `slides` 不参与检索。结果包含 `heading_path`、`anchor` 和可直接用于引用的 `citation_target`；`read_wiki_page` 仍以不含锚点的 `path` 读取整页。

Chat 支持紧接正文的显示公式、同一行中的多个独立公式，以及公式内容与首尾 `$$` 定界符同处一行；未闭合的定界符按普通 Markdown 保留，Wiki 和课件继续使用标准文档解析。

索引位于 `{FRANKIE_DATA_DIR}/search/wiki_<root_hash>.sqlite3`，同一 Wiki 根目录供全班共享，不写入课程仓库。部署以单个事务重建索引；首次使用缺失的索引会自动构建。普通检索不扫描源文件或检查修改时间，更新内容后须显式重建。索引记录版本、Wiki 根目录和文件清单哈希。`/api/query` 使用其独立的上下文检索路径。

索引使用 Markdown 可见正文，排除链接目标、来源标注及无正文的结构章节。摘录保留原始 Markdown，优先完整段落、列表和相邻公式，通常约 900 字符，上限 1,200 字符；超长块跳过而不截断公式或代码，没有可用完整块时返回空摘录并通过页面获取证据。

## 学习情况（管理员）

管理员从左侧「学习情况」进入独立的学情分析页面：

- **学生问答记录**：按学生查看会话、逐轮提问、助教回答、回答状态和附件。只读访问，不修改学生的会话状态。学生账号只能访问本人的历史，不能访问此页面或对应的 `/api/admin/*` 接口。
- **全班问题摘要**：点击「生成新摘要」，使用配置的 DeepSeek 默认模型分析学生提问。只分析已保存的 Chat 提问，不含助教回答、附件内容、管理员提问或未持久化的 Query 问答。统计包含回答失败、停止或仍在生成的已提交提问；空白文本不纳入摘要。
- 首次覆盖全部已保存的学生提问；后续每份报告只覆盖上次截止时间之后的新提问，不重算历史报告。页面展示生成时间、覆盖时间段、提问数和学生数，时间均为服务器本地时间。
- 截止时间在读取提问前确定；生成期间的新提问留给下一份报告。生成失败或没有新提问时不推进截止时间。长输入分批分析后合并，所有批次成功才保存报告。单 worker 服务内同时只生成一份全班报告。
- 报告保存为 `FRANKIE_DATA_DIR/admin/summaries/<id>.md`，正文为 Markdown，frontmatter 保存生成时间和统计信息；`window_end` 是下一次增量分析的起点。备份时请保留整个目录及这些元数据。
- 摘要仅描述本时间段的提问与共性困惑，不推断学生已掌握、已解决或已获讲解的程度。提交给模型时用临时编号代替账号，消耗记在发起生成的管理员的 `class_summary` token 日志中，不占学生配额。

---

## CLI 命令

```bash
frankie                  # 进入对话
frankie chat             # 同上
frankie status           # 查看状态、余额、Token 消耗
frankie sources          # 列出原始资料
frankie rebuild-wiki-index # 更新共享课程 Wiki 检索索引

frankie query "问题"              # 基于知识库提问
frankie query "问题" --reason     # 深度推理模式

frankie-smoke            # 运行烟雾测试
```

---

## 目录结构

单用户 Vault（CLI / 本地开发）：

```
你的Vault/
└── frankie-wiki/           # 供查询的 Markdown 知识库
    ├── index.md            # 索引
    ├── 数学/
    │   └── 微积分.md
    └── raw/               # 原始资料
        └── 数学/
            └── 微积分笔记.md
```

多用户部署的数据目录见上文「多用户部署」一节。

---

## 配置

`config/settings.toml`：

```toml
[vault]
path = "path/to/your/references"   # 课程资料根目录（单人模式）
wiki_dir = "frankie-wiki"          # Wiki 目录名
raw_sources_dir = "frankie-wiki/raw"

[llm]
default_model = "deepseek-flash"
reasoning_model = "deepseek-v4-pro"
max_tokens = 8192
temperature = 0.7

[auth]
daily_token_limit = 50000          # 每用户每日 token 上限
```

Web 聊天使用 `default_model`，关闭思考模式，每次模型调用的输出上限为 32,768 tokens。其他调用仍使用各自配置。

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

Frankie 使用 SQLite 作为对话历史的存储后端。

- 数据库文件路径：`<vault>/.frankie/memory.db`
- 每个用户的对话历史存放在独立的 `.frankie` 目录。
- 本地与服务器启动时，统一为所有已注册账号初始化并校验历史表，保留已有对话；初始化失败则不开始提供服务。维护账号列表后应重启服务。
- 不需要额外的数据库环境变量，路径由 `VaultContext` 根据当前数据目录自动创建。

## 运行环境一致性

本地与服务器使用同一套锁定依赖，避免“本地正常、服务器报错”：

- `uv.lock` 固定 Python 依赖，`.python-version` 固定 Python 3.14；部署脚本每次部署都执行 `uv sync --locked --extra web`，并在版本不符时明确报错。
- `pnpm-lock.yaml` 固定前端依赖，`devEngines.runtime` 固定 Node 24.19.0，`packageManager` 固定 pnpm 11，并由 pnpm 自动获取；构建脚本使用该运行时，而不是系统 Node。
- 国内网络下，Python 包从 TUNA 镜像、npm 包与 Node 运行时从 npmmirror 获取（见 `pyproject.toml`、`frontend/.npmrc`、`frontend/pnpm-workspace.yaml`）；上游 nodejs.org 不可达，PyPI 文件站实测约 27 KB/s。切换回上游只需删掉这三处配置。
- `pnpm-lock.yaml` 直接记录 Node 运行时的下载地址，因此锁文件里存的是 npmmirror 地址，`--frozen-lockfile` 不会重新解析。重新生成锁文件时必须保留 `nodeDownloadMirrors` 配置，否则地址会退回 nodejs.org。
- 服务启动时先校验账号历史表结构，再开始接收请求。
