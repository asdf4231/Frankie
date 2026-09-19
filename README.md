# Frankie — Dynamic Optimization TA

基于 LLM 的课程问答助手。师生可以检索课程 Wiki、阅读讲义，并通过对话提问。

一套系统服务整个班级（50–100 人），课程资料全班共享，附件和对话历史互相隔离。

**前置要求：** Python 3.14（`.python-version` 固定）、Node 24.19.0（pnpm 自动获取）、pnpm 11+、uv、DeepSeek API Key

---

## 课程问答

课程 Wiki 从独立 Git 仓库的 `llm_wiki` 读取，由教师在课程仓库维护。

- 对话通过章节级 BM25 检索和整页阅读获取依据，返回保留 Markdown 段落、公式和代码的原文摘录。
- 文件库和聊天引用支持跳转到 Wiki、讲义中的具体章节，并保留浏览历史位置。
- 在 Wiki 或讲义中选中文字后点击 **Quote**，直接开启新对话并填入原文和来源名称，补充问题后自行发送。
- 对话支持图片和文档附件，并自动保存历史。服务器接收问题后，刷新、关闭标签页或切换页面不打断生成；返回后继续显示进度，**Stop** 明确停止当前回答。
- 同一账号的可见页面实时同步对话；后台标签页释放实时连接，返回时自动补齐。历史列表独立加载，不等待实时连接。当前对话被删除时回到空白对话，保留未发送的草稿和附件。
- 发送时将新问题放在聊天窗口约 40% 高度，为下方回答留出空间；长问题靠近顶部。回答填满这一区域后按内容自然增长，输出不推动视口，短回答完成时也不回跳。返回对话恢复保存的阅读位置；向下按钮只跳转一次。

---

## 快速开始（本地开发）

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
git clone --filter=blob:none --no-checkout <course-repo-url> ../course
git -C ../course sparse-checkout set --no-cone '/llm_wiki/' '!**/slides/'
git -C ../course checkout master

# 构建前端并启动
pnpm --dir frontend build
uv run frankie rebuild-wiki-index
uv run frankie web
```

浏览器打开 `http://localhost:7860`。

默认仅监听本机；需要局域网访问时显式传入 `--host 0.0.0.0`。

---

## 多用户部署（班级使用）

部署方式见 [deploy/README.md](deploy/README.md)：一个部署脚本、systemd 用户服务、现有 Caddy 反代。

- `FRANKIE_COURSE_WIKI_PATH` 指向独立课程仓库的 `llm_wiki`，默认项目旁的 `../course/llm_wiki`。
- `index.md` 是目录，`faq.md` 提供课程信息，主题目录是概念 Wiki。
- `raw/` 中的 Markdown 讲义在文件库的「课件」页展示，主题页面在「Wiki」页展示。
- 部署更新课程仓库、构建前端和共享检索索引，再重启服务；本地修改 Wiki 后运行 `frankie rebuild-wiki-index`。
- `FRANKIE_DATA_DIR` 保存账号、个人资料、历史和共享检索索引，与两个 Git 仓库分开。

认证使用本地账号密码和签名会话 Cookie。管理员可查看系统设置、余额和学习情况。账号、显示名称、角色和加盐密码哈希保存在 `data/auth/users.json`，由服务器管理员维护。

### 演示账号

演示账号供校外或未注册的用户体验助教。它仍是学生角色（`role = "student"`），走与学生完全相同的对话、Wiki、讲义、附件、历史和引用代码路径，只在账号记录上多两个字段：

```json
"test": {
  "display_name": "Frankie 演示账号",
  "role": "student",
  "is_demo": true,
  "daily_token_limit": 10000,
  "password_salt": "<salt>",
  "password_hash": "<pbkdf2 hash>"
}
```

- `is_demo = true`：登录后界面顶部显示中文提示条；思考等级只展示「无思考」和「低思考」（`off`/`low`，此为界面限制，后端接口不变）；设置页不提供修改密码表单，密码由管理员用与其他账号相同的方式设置；提问不写入 `admin/question_log.jsonl`，账号不出现在管理员的学生名单、学生记录和全班问题摘要中，也不计入学生人数。它自己的对话历史和 token 日志照常工作。
- `daily_token_limit`：账号级每日 token 限额（正整数），优先于 `settings.toml` 的全局学生限额；缺省时沿用全局值。任何学生记录都可以设置，不限于演示账号。管理员始终不限。
- 前端只依据登录和 `/api/auth/me` 返回的 `is_demo` 与 `capabilities` 渲染限制，不依据账号名。

初始演示账号登录名为 `test`，密码由管理员线下告知，不写入仓库或界面。填充示例对话时可临时调高 `daily_token_limit`，以演示账号提问，再改回；其对话就是普通历史，用户可以照常新建、重命名和删除。修改 `users.json` 后重启服务。

## Wiki 检索

Chat 预载 `faq.md` 中 `## Frequently Asked Questions in Dynamic Optimization` 之前的课程信息作为参考资料；详细 FAQ 和其他 Wiki 内容由模型在静默准备阶段决定何时检索或阅读。检索和阅读进度单独展示；准备完成后，独立生成最终回答并实时流式显示。`search_wiki` 使用 SQLite FTS5、英文 Porter 词干和章节级加权 BM25，忽略常见英文问句词。FAQ 条目、概念 Wiki 页面和讲义幻灯片在同一相关度排序中竞争：先匹配全部查询词，结果不足时匹配部分词。FAQ 条目只按其自身问题标题和正文匹配，整页标题和「Frequently Asked Questions in …」这类上层标题不计入相关度；概念 Wiki 和讲义的上层标题仍参与匹配并作为语义上下文。FAQ 按条目返回完整答案；概念 Wiki 每页只保留最佳章节；`topic="raw"` 检索讲义时以 `####` 幻灯片为单位，同一讲义可返回多张相关幻灯片。显式 `topic` 仍限定检索范围；默认检索概念 Wiki。根目录 `index.md`、`progress.md` 和 `slides` 不参与检索。结果包含 `heading_path`、`anchor` 和可直接用于引用的 `citation_target`。`read_wiki_page(path, anchor=None)` 不带锚点时读取整页；带上检索结果中的 `anchor` 时按标题层级原样截取源 Markdown：`####` 只返回该幻灯片，`###` 返回该小节及其幻灯片，`##` 返回整节，直到下一个同级或更高级标题为止。

Chat 支持紧接正文的显示公式、同一行中的多个独立公式，以及公式内容与首尾 `$$` 定界符同处一行；未闭合的定界符按普通 Markdown 保留，Wiki 和课件继续使用标准文档解析。

索引位于 `{FRANKIE_DATA_DIR}/search/wiki_<root_hash>.sqlite3`，同一 Wiki 根目录供全班共享，不写入课程仓库。部署以单个事务重建索引；首次使用缺失的索引会自动构建。普通检索不扫描源文件或检查修改时间，更新内容后须显式重建。索引记录版本、Wiki 根目录和文件清单哈希。

索引使用 Markdown 可见正文，排除链接目标、来源标注及无正文的结构章节。摘录保留原始 Markdown，选取包含查询词最多的完整块并扩展相邻段落、列表和公式，总长通常约 900 字符；块从不截断，超长块（如很长的列表）整块返回。

## 学习情况（管理员）

管理员从左侧「学习情况」进入独立的学情分析页面：

- **学生问答记录**：按学生查看会话、逐轮提问、助教回答、回答状态和附件。只读访问，不修改学生的会话状态。学生账号只能访问本人的历史，不能访问此页面或对应的 `/api/admin/*` 接口。
- **全班问题摘要**：点击「生成新摘要」，使用配置的 DeepSeek 默认模型分析学生提问。只分析已保存的学生提问，不含助教回答、附件内容或管理员提问。统计包含回答失败、停止或仍在生成的已提交提问；空白文本不纳入摘要。
- 首次覆盖全部已保存的学生提问；后续每份报告只覆盖上次截止时间之后的新提问，不重算历史报告。页面展示生成时间、覆盖时间段、提问数和学生数，时间均为服务器本地时间。
- 截止时间在读取提问前确定；生成期间的新提问留给下一份报告。生成失败或没有新提问时不推进截止时间。长输入分批分析后合并，所有批次成功才保存报告。单 worker 服务内同时只生成一份全班报告。
- 报告保存为 `FRANKIE_DATA_DIR/admin/summaries/<id>.md`，正文为 Markdown，frontmatter 保存生成时间和统计信息；`window_end` 是下一次增量分析的起点。备份时请保留整个目录及这些元数据。
- 摘要仅描述本时间段的提问与共性困惑，不推断学生已掌握、已解决或已获讲解的程度。提交给模型时用临时编号代替账号，消耗记在发起生成的管理员的 `class_summary` token 日志中，不占学生配额。

---

## 运维命令

```bash
frankie web                # 启动本地 Web 应用
frankie rebuild-wiki-index # 更新共享课程 Wiki 检索索引
```

---

## 配置

`config/settings.toml`：

```toml
[llm]
base_url = "https://api.deepseek.com"
default_model = "deepseek-flash"
max_tokens = 8192

[auth]
daily_token_limit = 50000          # 学生每日 token 上限；账号记录中的 daily_token_limit 可单独覆盖

[content]
wiki_path = "/path/to/llm_wiki"
```

Web 聊天使用 `default_model`，关闭思考模式，每次模型调用的输出上限为 32,768 tokens。

## 环境变量

Frankie 的 `.env` 仅用于机密信息：

- `DEEPSEEK_API_KEY`：DeepSeek API 密钥。
- `FRANKIE_AUTH_SECRET`：会话签名密钥。

其余配置优先从 `config/settings.toml` 加载，必要时可通过环境变量覆盖：

- `FRANKIE_DATA_DIR`：多用户数据根目录，默认项目内的 `data`。
- `FRANKIE_COURSE_WIKI_PATH`：独立课程仓库的 `llm_wiki` 绝对路径。
- `FRANKIE_LLM_BASE_URL`：LLM 接口地址。
- `FRANKIE_LLM_DEFAULT_MODEL`：默认会话模型。

## 数据库与持久化

Frankie 使用 SQLite 作为对话历史的存储后端。

- 数据库文件路径：`{FRANKIE_DATA_DIR}/users/<user_id>/.frankie/memory.db`。
- 每个用户的对话历史存放在独立的 `.frankie` 目录。
- 本地与服务器启动时，统一为所有已注册账号初始化并校验历史表，保留已有对话；初始化失败则不开始提供服务。维护账号列表后应重启服务。
- 不需要额外的数据库环境变量，路径由当前用户的数据目录自动确定。

## 运行环境一致性

本地与服务器使用同一套锁定依赖，避免“本地正常、服务器报错”：

- `uv.lock` 固定 Python 依赖，`.python-version` 固定 Python 3.14；部署脚本每次部署都执行 `uv sync --locked --extra web`，并在版本不符时明确报错。
- `pnpm-lock.yaml` 固定前端依赖，`devEngines.runtime` 固定 Node 24.19.0，`packageManager` 固定 pnpm 11，并由 pnpm 自动获取；构建脚本使用该运行时，而不是系统 Node。
- 国内网络下，Python 包从 TUNA 镜像、npm 包与 Node 运行时从 npmmirror 获取（见 `pyproject.toml`、`frontend/.npmrc`、`frontend/pnpm-workspace.yaml`）；上游 nodejs.org 不可达，PyPI 文件站实测约 27 KB/s。切换回上游只需删掉这三处配置。
- `pnpm-lock.yaml` 直接记录 Node 运行时的下载地址，因此锁文件里存的是 npmmirror 地址，`--frozen-lockfile` 不会重新解析。重新生成锁文件时必须保留 `nodeDownloadMirrors` 配置，否则地址会退回 nodejs.org。
- 服务启动时先校验账号历史表结构，再开始接收请求。
