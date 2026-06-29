# Frankie — 厦门大学课程辅助系统

基于 LLM 的个人课程辅导知识库。将课程 Markdown 资料交给 Frankie 消化，即可随时提问检索。

**前置要求：** Python 3.11+、DeepSeek API Key

---

## 快速开始

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

---

## 配置

`config/settings.toml`：

```toml
[vault]
path = "D:/Study"              # 课程资料根目录
wiki_dir = "frankie-wiki"      # Wiki 目录名
raw_sources_dir = "origin-sources"

[llm]
default_model = "deepseek-v4-flash"
reasoning_model = "deepseek-v4-pro"
max_tokens = 8192
temperature = 0.7
```
## 编辑个人Wiki
查看 `config/_index.example.md` 按照相关说明编辑个人Wiki文件夹index.md.