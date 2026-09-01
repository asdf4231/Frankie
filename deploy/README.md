# Frankie 部署与更新手册（阿里云）

系统由**两个独立 git 仓库**驱动，务必分清它们的更新方式：

| 仓库 | 内容 | 更新方式 | 是否需要部署/重启 |
|---|---|---|---|
| Frankie 代码仓库（本仓库） | 后端 `.py`、前端 `src/` | `git pull` + 重建前端 + `systemctl restart frankie` | ✅ 需要 |
| 课程内容仓库 `dynamic_optimization_2026` | FAQ / 进度 / Wiki / 讲义 | `git pull` 或后台「同步」按钮 | ❌ 不需要（改完即生效） |

## 首次部署

```bash
cd /opt/frankie              # 你的代码仓库路径
git pull                     # 拉取最新 Frankie 代码
bash deploy/setup.sh         # 装依赖、build 前端、clone 内容仓库
```

然后：
1. 编辑 `.env` 填入 `DEEPSEEK_API_KEY` 和 `FRANKIE_AUTH_SECRET`。
2. 配置 GitHub 凭据（后台「推送」按钮需要）：HTTPS token 或 SSH key。
3. 安装服务与反代：

```bash
sudo cp deploy/frankie.service /etc/systemd/system/
sudo systemctl enable --now frankie
# nginx：把 deploy/nginx.conf 的 location 合并进你的 server 块（注意 SSL）
sudo nginx -t && sudo systemctl reload nginx
```

## 日常更新内容（最常见，无需重启）

学生问到的 FAQ、课程进度、Wiki、讲义都来自内容仓库，改了**立即生效**：

- **方式一（后台）**：登录管理员 →「内容管理」→ 点「🔄 同步」。
- **方式二（命令行）**：

```bash
cd /opt/frankie/data/content/dynamic_optimization_2026
git pull --ff-only
```

## 在后台编辑 FAQ / 课程进度

1. 管理员登录 →「内容管理」。
2. 左侧「管理文件」分组下打开 `_admin/faq.md` 或 `_admin/progress.md`。
3. 编辑 →「💾 保存」= 写盘 + 自动 commit，立即生效。
4. 点「⬆ 推送」把改动传回 GitHub（这样你本地也能 pull 到）。

> 约定：FAQ 与进度存在内容仓库的 `llm_wiki/_admin/` 下，对学生不可见（检索/文件库均已过滤）。

## 更新代码（后端/前端改动）

```bash
cd /opt/frankie
git pull
(cd frontend && pnpm install && pnpm build)   # 前端有改动时才需要
sudo systemctl restart frankie
```

## FAQ / 进度文件格式示例

`_admin/faq.md`（每条约定的问答对，模型会优先采用）：

```markdown
# 常见问题

## Q: 作业提交截止时间是？
A: 每周日 23:59 前提交到课程平台。

## Q: 考试可以带什么？
A: 允许带一张 A4 手写公式纸。
```

`_admin/progress.md`（描述当前课程进度，模型每次回答都会读取）：

```markdown
# 课程进度

当前进度：已讲到第 6 讲「约束优化（KKT 条件）」，下节课讲「包络定理」。
尚未讲到的内容：动态规划、最优控制（第 8 讲以后）。
```
