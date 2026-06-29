# Frankie Ability MVP — 智能能力增强规划

> **核心目标**：让 Frankie 从"被动响应"升级为"主动助手"  
> **战略定位**：时间感知 + 主动任务 + 工具调用，三大能力赋予 Frankie "智能"  
> **实施周期**：Phase 1（2 周）+ Phase 2（2 周）+ Phase 3（3 周）

---

## 一、设计理念

### 1.1 从被动到主动

**当前状态**（被动响应）：
- 用户问 → Frankie 答
- 用户执行命令 → Frankie 执行
- Frankie 没有时间概念，不知道"3 天前"是什么

**目标状态**（主动智能）：
- Frankie 知道时间流逝，能说"上次你问这个是 3 天前"
- Frankie 主动提醒："你已经一周没摄取新资料了哦～"
- Frankie 早上主动推送："昨天 Wiki 新增了 3 条笔记"
- Frankie 能调用工具：搜索网络、查天气、发邮件

### 1.2 能力边界

**做什么**：
- ✅ 时间感知：记录用户行为时间戳，计算时间差
- ✅ 主动提醒：定时检查状态，推送通知
- ✅ 工具调用：接入 MCP 生态，调用外部 API
- ✅ 低成本交互：邮件、Webhook、RSS

**不做什么**：
- ❌ 复杂的任务调度（不做 Celery/RQ 那种重型框架）
- ❌ 实时监控（不做 24/7 心跳检测）
- ❌ 多用户协作（MVP 阶段只服务单一用户）

---

## 二、Phase 1：时间感知（2 周）

**目标**：Frankie 有"时间记忆"，能回忆过去，感知频率

### 2.1 时间戳系统

#### 数据结构

**`.frankie/timeline.json`**：记录用户行为时间线
```json
{
  "version": 1,
  "events": [
    {
      "id": "evt_20260620_001",
      "timestamp": "2026-06-20T10:30:00Z",
      "type": "chat",
      "summary": "用户询问关于 LLM Wiki 的问题",
      "related_pages": ["[[LLM-Wiki 理念]]"]
    },
    {
      "id": "evt_20260620_002",
      "timestamp": "2026-06-20T14:22:00Z",
      "type": "ingest",
      "summary": "摄取了 5 篇文章",
      "files": ["认知科学/xxx.md", "..."],
      "wiki_pages": ["sources/xxx-2026-06-20.md"]
    },
    {
      "id": "evt_20260617_003",
      "timestamp": "2026-06-17T09:15:00Z",
      "type": "query",
      "question": "DeepSeek API 怎么优化？",
      "archived": false
    }
  ],
  "stats": {
    "last_ingest": "2026-06-20T14:22:00Z",
    "last_chat": "2026-06-20T10:30:00Z",
    "last_query": "2026-06-17T09:15:00Z",
    "total_sessions": 42,
    "active_days": ["2026-06-15", "2026-06-17", "2026-06-20"]
  }
}
```

#### 记录时机

**在现有函数中插桩**：

```python
# agent.py
from Frankie.timeline import record_event

async def chat_turn(...):
    # ... 原有逻辑 ...
    record_event("chat", summary=user_input[:50])
    # ...

async def ingest(...):
    # ... 原有逻辑 ...
    record_event("ingest", files=[source_path], wiki_pages=[wiki_page])
    # ...

async def query(...):
    # ... 原有逻辑 ...
    record_event("query", question=question, archived=archive)
    # ...
```

---

### 2.2 时间感知能力

#### Feature 1: 回忆"上次"

**实现**：在 chat 时注入时间上下文

```python
# agent.py
def _build_time_context() -> str:
    """构建时间感知上下文"""
    timeline = load_timeline()
    
    # 计算距离上次行为的时间
    last_ingest = timeline['stats'].get('last_ingest')
    if last_ingest:
        days_since_ingest = (datetime.now() - parse_datetime(last_ingest)).days
        if days_since_ingest == 0:
            ingest_hint = "今天刚摄取过新资料"
        elif days_since_ingest == 1:
            ingest_hint = "昨天摄取过新资料"
        else:
            ingest_hint = f"{days_since_ingest} 天没摄取新资料了"
    else:
        ingest_hint = "还没有摄取过资料"
    
    # 最近活跃天数
    active_days = timeline['stats'].get('active_days', [])
    recent_active = len([d for d in active_days if is_within_days(d, 7)])
    
    return f"""
时间背景：
- 上次摄取：{ingest_hint}
- 最近 7 天活跃：{recent_active} 天
- 今天日期：{datetime.now().strftime('%Y-%m-%d %A')}
"""

async def chat_turn(...):
    time_context = _build_time_context()
    
    chat_system = (
        _BASE_SYSTEM
        + persona_prompt
        + f"\n{time_context}\n"
        + """
你可以利用时间信息：
- 回忆："上次你问这个是 3 天前"
- 提醒："你已经一周没摄取新资料了哦～"
- 鼓励："今天已经摄取了 5 篇，继续加油！"
"""
    )
```

**效果预览**：
```
用户：DeepSeek API 怎么优化？
Frankie：这个问题你 3 天前问过哦～ 🔮 那时候我建议了 KV Cache 优化，
      现在是不是遇到新的问题了？
```

#### Feature 2: 频率提醒

**实现**：在 chat 启动时检查并提醒

```python
# cli.py chat() 函数
def chat():
    console.print(_WELCOME)
    
    # 时间感知问候
    timeline = load_timeline()
    last_ingest_days = get_days_since(timeline['stats'].get('last_ingest'))
    
    if last_ingest_days >= 7:
        console.print("[yellow]💀 Frankie 提醒：你已经一周没摄取新资料了哦～ "
                     "魔法书快要落灰啦！[/yellow]\n")
    elif last_ingest_days >= 3:
        console.print("[dim]🔮 已经 {last_ingest_days} 天没更新魔法书啦，"
                     "有新知识要记录吗？[/dim]\n")
```

#### Feature 3: 行为统计

**新命令**：`frankie timeline`

```python
@main.command()
def timeline():
    """显示用户行为时间线"""
    data = load_timeline()
    
    console.print("\n[bold cyan]📅 Frankie 时间线[/bold cyan]\n")
    
    # 统计卡片
    stats_table = Table(show_header=False, box=None)
    stats_table.add_column("指标", style="bold dim")
    stats_table.add_column("值")
    
    stats_table.add_row("总会话次数", str(data['stats']['total_sessions']))
    stats_table.add_row("活跃天数", f"{len(data['stats']['active_days'])} 天")
    stats_table.add_row("上次摄取", humanize_time(data['stats']['last_ingest']))
    stats_table.add_row("上次对话", humanize_time(data['stats']['last_chat']))
    
    console.print(stats_table)
    
    # 最近事件
    console.print("\n[bold]最近 10 条事件[/bold]\n")
    for event in data['events'][-10:]:
        icon = {"chat": "💬", "ingest": "📥", "query": "🔍"}[event['type']]
        time_str = humanize_time(event['timestamp'])
        console.print(f"{icon} {time_str} - {event['summary']}")
```

---

### 2.3 Phase 1 交付物

**新增模块**：
- `src/frankie/timeline.py` — 时间线管理（记录、查询、统计）
- `.frankie/timeline.json` — 用户行为时间线数据

**功能清单**：
- ✅ 所有操作（chat/ingest/query）自动记录时间戳
- ✅ Frankie 能说"上次你问这个是 X 天前"
- ✅ Chat 启动时提醒"X 天没摄取新资料"
- ✅ `frankie timeline` 命令查看行为统计
- ✅ 时间上下文注入 System Prompt

---

## 三、Phase 2：主动任务（2 周）

**目标**：Frankie 能主动推送通知，定时执行任务

### 3.1 架构设计

#### 轻量级任务调度

**不用 Celery/RQ（太重）**，用简单的 Cron + 后台进程

```
┌─────────────────┐       ┌──────────────────┐
│  Cron Job       │ ───→  │  frankie daemon    │
│  (系统定时器)    │       │  (后台守护进程)   │
└─────────────────┘       └──────────────────┘
                                    ↓
                          ┌──────────────────┐
                          │  通知渠道         │
                          │  - CLI 提示      │
                          │  - 系统通知      │
                          │  - 邮件（可选）  │
                          └──────────────────┘
```

#### 任务类型

| 任务 | 触发时机 | 行为 |
|------|---------|------|
| 晨间摘要 | 每天 8:00 | 总结昨天 Wiki 更新 |
| 周报 | 每周一 9:00 | 本周知识积累统计 |
| 闲置提醒 | 每天检查 | 超过 7 天未摄取资料时提醒 |
| 生日祝福 | 用户生日 | Frankie 送祝福 🎃 |

---

### 3.2 守护进程实现

#### 启动命令

```bash
frankie daemon start    # 启动后台守护进程
frankie daemon stop     # 停止
frankie daemon status   # 查看状态
```

#### 实现方案

**`src/frankie/daemon.py`**：
```python
import schedule
import time
from pathlib import Path

def morning_summary():
    """晨间摘要任务"""
    from Frankie.vault import list_wiki_notes
    from Frankie.timeline import load_timeline
    
    timeline = load_timeline()
    yesterday = (datetime.now() - timedelta(days=1)).date()
    
    # 筛选昨天的事件
    yesterday_events = [
        e for e in timeline['events']
        if parse_datetime(e['timestamp']).date() == yesterday
    ]
    
    if not yesterday_events:
        return  # 昨天没活动，不推送
    
    # 生成摘要
    ingest_count = len([e for e in yesterday_events if e['type'] == 'ingest'])
    chat_count = len([e for e in yesterday_events if e['type'] == 'chat'])
    
    message = f"""
🌅 早安～ Frankie 晨间摘要

昨天你：
- 📥 摄取了 {ingest_count} 次新资料
- 💬 和我聊了 {chat_count} 次天
- 📚 Wiki 新增了 {ingest_count} 个页面

今天也要继续加油哦！✨
"""
    
    # 推送通知
    send_notification("Frankie 晨间摘要", message)


def idle_reminder():
    """闲置提醒任务"""
    timeline = load_timeline()
    last_ingest = timeline['stats'].get('last_ingest')
    
    if not last_ingest:
        return
    
    days_idle = (datetime.now() - parse_datetime(last_ingest)).days
    
    if days_idle >= 7:
        message = f"""
💀 Frankie 提醒：已经 {days_idle} 天没摄取新资料了哦～
魔法书快要落灰啦！要不要找点新知识来学习？
"""
        send_notification("Frankie 闲置提醒", message)


def start_daemon():
    """启动守护进程"""
    # 注册定时任务
    schedule.every().day.at("08:00").do(morning_summary)
    schedule.every().day.at("20:00").do(idle_reminder)
    schedule.every().monday.at("09:00").do(weekly_report)
    
    # 持久化 PID
    pid_file = Path.home() / ".frankie" / "daemon.pid"
    pid_file.write_text(str(os.getpid()))
    
    print("🔮 Frankie 守护进程已启动")
    
    # 主循环
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次
```

---

### 3.3 通知渠道

#### 方案 1: 系统通知（推荐）

**macOS**：
```python
def send_notification(title: str, message: str):
    import subprocess
    script = f'''
    display notification "{message}" with title "{title}" sound name "Frog"
    '''
    subprocess.run(["osascript", "-e", script])
```

**Linux**：
```python
def send_notification(title: str, message: str):
    import subprocess
    subprocess.run(["notify-send", title, message])
```

**Windows**：
```python
def send_notification(title: str, message: str):
    from win10toast import ToastNotifier
    toaster = ToastNotifier()
    toaster.show_toast(title, message, duration=10)
```

#### 方案 2: CLI 内提示

**实现**：在 `.frankie/notifications.json` 中暂存

```json
{
  "unread": [
    {
      "id": "notif_001",
      "timestamp": "2026-06-21T08:00:00Z",
      "title": "晨间摘要",
      "message": "昨天摄取了 3 次新资料...",
      "read": false
    }
  ]
}
```

**Chat 启动时显示**：
```python
# cli.py chat()
def chat():
    # 显示未读通知
    notifications = load_notifications()
    unread = [n for n in notifications['unread'] if not n['read']]
    
    if unread:
        console.print(f"\n[yellow]📬 你有 {len(unread)} 条未读消息[/yellow]\n")
        for notif in unread[:3]:  # 只显示前 3 条
            console.print(f"[dim]{notif['title']}[/dim]: {notif['message']}\n")
        mark_as_read(unread)
```

#### 方案 3: 邮件通知（可选）

**使用场景**：用户不在电脑前，通过邮件提醒

```python
def send_email_notification(title: str, message: str):
    import smtplib
    from email.mime.text import MIMEText
    
    user_email = settings.notifications.email  # 从配置读取
    
    msg = MIMEText(message, 'plain', 'utf-8')
    msg['Subject'] = f"[Frankie] {title}"
    msg['From'] = "Frankie@yourdomain.com"
    msg['To'] = user_email
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login("your_email", "your_password")
        server.send_message(msg)
```

---

### 3.4 周报生成

**功能**：每周一自动生成上周的知识积累报告

```python
def weekly_report():
    """生成周报"""
    timeline = load_timeline()
    last_week_start = (datetime.now() - timedelta(days=7)).date()
    
    # 筛选上周事件
    week_events = [
        e for e in timeline['events']
        if parse_datetime(e['timestamp']).date() >= last_week_start
    ]
    
    ingest_count = len([e for e in week_events if e['type'] == 'ingest'])
    chat_count = len([e for e in week_events if e['type'] == 'chat'])
    query_count = len([e for e in week_events if e['type'] == 'query'])
    
    # 最活跃的 tag
    from Frankie.vault import list_wiki_notes
    recent_pages = [n for n in list_wiki_notes() if is_within_week(n.path.stat().st_mtime)]
    top_tags = get_top_tags(recent_pages, limit=5)
    
    report = f"""
📊 Frankie 周报（{last_week_start} - 今天）

本周成就：
- 📥 摄取资料：{ingest_count} 次
- 💬 对话次数：{chat_count} 次
- 🔍 查询次数：{query_count} 次
- 📚 Wiki 新增：{len(recent_pages)} 个页面

热门主题：
{', '.join(f'#{tag}' for tag in top_tags)}

继续保持哦！✨ 下周也要多多学习～
"""
    
    send_notification("Frankie 周报", report)
    
    # 同时写入 Wiki
    from Frankie.vault import write_wiki_note
    write_wiki_note(
        f"insights/weekly-report-{last_week_start}.md",
        report,
        metadata={"type": "insight", "source": "weekly_report", "date": str(datetime.now().date())}
    )
```

---

### 3.5 Phase 2 交付物

**新增模块**：
- `src/frankie/daemon.py` — 守护进程与任务调度
- `src/frankie/notifications.py` — 通知管理
- `.frankie/notifications.json` — 未读通知队列

**新增命令**：
- `frankie daemon start/stop/status` — 守护进程控制
- `frankie notifications` — 查看所有通知

**功能清单**：
- ✅ 每天 8:00 晨间摘要（昨天 Wiki 更新）
- ✅ 每周一周报（上周知识积累统计）
- ✅ 闲置 7 天自动提醒
- ✅ 系统通知 + CLI 内提示
- ✅ 周报自动写入 `insights/`

---

## 四、Phase 3：工具调用（3 周）

**目标**：Frankie 能主动调用外部工具，扩展能力边界

### 4.1 MCP 生态接入

#### 什么是 MCP？

**Model Context Protocol** — Anthropic 提出的标准化工具调用协议

```
┌─────────┐      MCP      ┌──────────┐
│  Frankie  │ ←──────────→  │  Tools   │
│  (LLM)  │               │  - 搜索  │
└─────────┘               │  - 天气  │
                          │  - 邮件  │
                          └──────────┘
```

**优势**：
- Anthropic SDK 原生支持
- 社区生态丰富（已有上百个 MCP 工具）
- 改造成本低（只需注册工具、解析调用）

#### 架构设计

```python
# llm.py 增加 tools 参数
async def chat_with_tools(
    system: str,
    messages: list[Message],
    tools: list[Tool],  # 新增
) -> str:
    response = await client.messages.create(
        model=settings.llm.default_model,
        system=system,
        messages=messages,
        tools=tools,  # 传入工具定义
        max_tokens=settings.llm.max_tokens,
    )
    
    # 处理 tool_use
    if response.stop_reason == "tool_use":
        for block in response.content:
            if block.type == "tool_use":
                result = execute_tool(block.name, block.input)
                # 继续对话，传入工具结果
                return await chat_with_tools(
                    system, messages + [tool_result_message(result)], tools
                )
    
    return extract_text(response.content)
```

---

### 4.2 内置工具集

#### Tool 1: 网络搜索

**功能**：Frankie 能主动搜索最新信息补充 Wiki

```python
from anthropic.types import ToolParam

SEARCH_TOOL: ToolParam = {
    "name": "web_search",
    "description": "搜索互联网获取最新信息。当 Wiki 中没有相关内容、或需要验证实时信息时使用。",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "搜索关键词"
            }
        },
        "required": ["query"]
    }
}

def execute_web_search(query: str) -> str:
    """调用 DuckDuckGo 或 Brave Search API"""
    import httpx
    
    # 使用 DuckDuckGo Instant Answer API（免费）
    response = httpx.get(
        "https://api.duckduckgo.com/",
        params={"q": query, "format": "json"}
    )
    data = response.json()
    
    if data.get('AbstractText'):
        return data['AbstractText']
    
    # 或使用 Brave Search（需 API Key，但结果更好）
    response = httpx.get(
        "https://api.search.brave.com/res/v1/web/search",
        headers={"X-Subscription-Token": settings.brave_api_key},
        params={"q": query}
    )
    results = response.json()['web']['results'][:3]
    
    return "\n\n".join([
        f"**{r['title']}**\n{r['description']}\n来源：{r['url']}"
        for r in results
    ])
```

**效果预览**：
```
用户：最新的 GPT-5 发布了吗？
Frankie：让我搜索一下最新消息... 🔮
      [调用 web_search("GPT-5 release date")]
      根据搜索结果，截至今天（2026-06-20），OpenAI 尚未正式发布 GPT-5...
```

#### Tool 2: 天气查询

```python
WEATHER_TOOL: ToolParam = {
    "name": "get_weather",
    "description": "获取指定城市的实时天气信息",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "城市名（如：北京、上海）"}
        },
        "required": ["city"]
    }
}

def execute_get_weather(city: str) -> str:
    """调用天气 API（如 OpenWeatherMap）"""
    import httpx
    
    response = httpx.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={
            "q": city,
            "appid": settings.weather_api_key,
            "units": "metric",
            "lang": "zh_cn"
        }
    )
    data = response.json()
    
    return f"""
{city} 实时天气：
- 温度：{data['main']['temp']}°C
- 体感：{data['main']['feels_like']}°C
- 天气：{data['weather'][0]['description']}
- 湿度：{data['main']['humidity']}%
"""
```

#### Tool 3: 发送邮件

**使用场景**：用户与他人交互的低成本方式

```python
SEND_EMAIL_TOOL: ToolParam = {
    "name": "send_email",
    "description": "发送电子邮件给指定收件人。用于分享知识、通知他人或协作。",
    "input_schema": {
        "type": "object",
        "properties": {
            "to": {"type": "string", "description": "收件人邮箱"},
            "subject": {"type": "string", "description": "邮件主题"},
            "body": {"type": "string", "description": "邮件正文（支持 Markdown）"}
        },
        "required": ["to", "subject", "body"]
    }
}

def execute_send_email(to: str, subject: str, body: str) -> str:
    """发送邮件"""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import markdown
    
    # Markdown 转 HTML
    html_body = markdown.markdown(body)
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.email.from_address
    msg['To'] = to
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    
    with smtplib.SMTP(settings.email.smtp_server, 587) as server:
        server.starttls()
        server.login(settings.email.username, settings.email.password)
        server.send_message(msg)
    
    return f"✅ 邮件已发送至 {to}"
```

**效果预览**：
```
用户：把我最近整理的"认知科学笔记"发给 alice@example.com
Frankie：好的，让我整理一下... 📚
      [读取 Wiki 相关页面]
      [调用 send_email]
      ✅ 已将《认知科学笔记摘要》发送给 Alice～
```

---

### 4.3 高级工具：Wiki 共享

#### Tool 4: 生成分享链接

**使用场景**：用户想分享某个 Wiki 页面给朋友

```python
SHARE_WIKI_TOOL: ToolParam = {
    "name": "share_wiki_page",
    "description": "生成 Wiki 页面的分享链接，允许他人在线阅读（只读）",
    "input_schema": {
        "type": "object",
        "properties": {
            "page_name": {"type": "string", "description": "Wiki 页面名（如：LLM-Wiki 理念）"},
            "expire_days": {"type": "integer", "description": "链接有效期（天）", "default": 7}
        },
        "required": ["page_name"]
    }
}

def execute_share_wiki_page(page_name: str, expire_days: int = 7) -> str:
    """生成临时分享链接"""
    from Frankie.vault import read_wiki_note
    import secrets
    
    # 读取页面内容
    content = read_wiki_note(f"sources/{page_name}.md")
    
    # 生成随机 token
    share_token = secrets.token_urlsafe(16)
    
    # 存储到分享池
    share_data = {
        "token": share_token,
        "page_name": page_name,
        "content": content,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(days=expire_days)).isoformat()
    }
    
    # 写入 .frankie/shares.json
    shares = load_shares()
    shares[share_token] = share_data
    save_shares(shares)
    
    # 返回链接（需要有 Web 服务）
    share_url = f"https://Frankie.yourdomain.com/share/{share_token}"
    
    return f"""
✅ 分享链接已生成：
🔗 {share_url}

有效期：{expire_days} 天
提示：链接失效后内容将自动删除
"""
```

**Web 端实现**（Phase 2 Web UI 时配套）：
```python
# api.py
@app.get("/share/{token}")
async def view_shared_page(token: str):
    shares = load_shares()
    
    if token not in shares:
        return {"error": "链接不存在或已失效"}
    
    share = shares[token]
    
    # 检查是否过期
    if datetime.now() > parse_datetime(share['expires_at']):
        return {"error": "链接已过期"}
    
    return {
        "page_name": share['page_name'],
        "content": share['content'],
        "expires_at": share['expires_at']
    }
```

---

### 4.4 工具注册与管理

#### 配置文件

**`.frankie/tools_config.json`**：用户控制启用哪些工具
```json
{
  "enabled_tools": [
    "web_search",
    "get_weather",
    "send_email",
    "share_wiki_page"
  ],
  "tool_settings": {
    "web_search": {
      "provider": "brave",  // duckduckgo | brave
      "max_results": 3
    },
    "send_email": {
      "require_confirmation": true  // 发送前需用户确认
    }
  }
}
```

#### 动态加载

```python
# src/frankie/tools.py
from anthropic.types import ToolParam

AVAILABLE_TOOLS: dict[str, ToolParam] = {
    "web_search": SEARCH_TOOL,
    "get_weather": WEATHER_TOOL,
    "send_email": SEND_EMAIL_TOOL,
    "share_wiki_page": SHARE_WIKI_TOOL,
}

TOOL_EXECUTORS = {
    "web_search": execute_web_search,
    "get_weather": execute_get_weather,
    "send_email": execute_send_email,
    "share_wiki_page": execute_share_wiki_page,
}

def get_enabled_tools() -> list[ToolParam]:
    """获取用户启用的工具列表"""
    config = load_tools_config()
    enabled = config.get('enabled_tools', [])
    return [AVAILABLE_TOOLS[name] for name in enabled if name in AVAILABLE_TOOLS]

def execute_tool(name: str, input_data: dict) -> str:
    """执行工具调用"""
    if name not in TOOL_EXECUTORS:
        return f"错误：未知工具 {name}"
    
    # 某些工具需要用户确认
    config = load_tools_config()
    if config['tool_settings'].get(name, {}).get('require_confirmation'):
        from rich.prompt import Confirm
        if not Confirm.ask(f"Frankie 想要调用工具 [{name}]，是否允许？"):
            return "用户取消了操作"
    
    try:
        return TOOL_EXECUTORS[name](**input_data)
    except Exception as e:
        return f"工具执行失败：{str(e)}"
```

---

### 4.5 集成到 Chat

```python
# agent.py
async def chat_turn(...):
    # 加载启用的工具
    tools = get_enabled_tools()
    
    system, messages = llm.build_messages(chat_system, history, user_input)
    
    # 使用 tools 参数
    if tools:
        response = await llm.chat_with_tools(system, messages, tools)
    else:
        response = await llm.chat(system, messages)
    
    return response
```

**System Prompt 增强**：
```python
chat_system += """
你可以使用以下工具增强能力：
{tool_list}

何时使用工具：
- Wiki 中没有相关内容，但用户需要最新信息 → web_search
- 用户问天气 → get_weather
- 用户想分享知识给他人 → send_email 或 share_wiki_page

使用工具前，先告诉用户你要做什么，例如："让我搜索一下最新消息..."
"""
```

---

### 4.6 社区工具生态（扩展）

#### 接入 MCP Community Tools

Anthropic 维护了一个 MCP 工具仓库：https://github.com/anthropics/anthropic-tools

**现成可用的工具**：
- `filesystem` — 文件操作
- `fetch` — HTTP 请求
- `memory` — 短期记忆存储
- `puppeteer` — 浏览器自动化
- `postgres` — 数据库查询

**集成方式**：
```bash
pip install anthropic-tools

# Python 代码
from anthropic_tools import get_tool

# 注册社区工具
AVAILABLE_TOOLS['filesystem'] = get_tool('filesystem')
```

---

### 4.7 Phase 3 交付物

**新增模块**：
- `src/frankie/tools.py` — 工具注册、管理、执行
- `.frankie/tools_config.json` — 工具配置
- `.frankie/shares.json` — Wiki 分享链接池

**新增命令**：
- `frankie tools list` — 查看所有可用工具
- `frankie tools enable <name>` — 启用工具
- `frankie tools disable <name>` — 禁用工具

**功能清单**：
- ✅ 网络搜索（DuckDuckGo / Brave）
- ✅ 天气查询（OpenWeatherMap）
- ✅ 发送邮件（SMTP）
- ✅ Wiki 页面分享（临时链接）
- ✅ 工具调用确认机制
- ✅ MCP 社区工具生态接入

---

## 五、用户交互能力增强

### 5.1 电子邮件场景深度挖掘

#### 场景 1: 知识分享

**用户**："把我的"认知科学笔记"整理一下发给 Alice"

**Frankie 行为**：
1. 搜索 Wiki 中所有带 `#认知科学` 的页面
2. 用 LLM 生成摘要邮件
3. 调用 `send_email` 工具发送
4. 记录到 `friendship.md`（Alice 对认知科学感兴趣）

#### 场景 2: 协作提醒

**用户**："每周五下午 5 点，把本周新增的笔记发给团队邮件列表"

**Frankie 行为**：
1. 在 `daemon` 中注册定时任务
2. 每周五生成"本周知识周报"
3. 发送到 `team@example.com`

#### 场景 3: 问答代理

**用户**："如果有人给 Frankie@mydomain.com 发邮件问问题，自动回复 Wiki 中的答案"

**实现方案**：
```python
# 新增：邮件监听服务
def email_inbox_listener():
    """监听收件箱，自动回复"""
    import imaplib
    import email
    
    imap = imaplib.IMAP4_SSL('imap.gmail.com')
    imap.login(settings.email.username, settings.email.password)
    imap.select('INBOX')
    
    while True:
        status, messages = imap.search(None, 'UNSEEN')
        
        for msg_id in messages[0].split():
            _, msg_data = imap.fetch(msg_id, '(RFC822)')
            email_body = email.message_from_bytes(msg_data[0][1])
            
            sender = email_body['From']
            subject = email_body['Subject']
            body = get_email_body(email_body)
            
            # 用 Frankie query 回答
            answer = asyncio.run(agent.query(body, archive=False))
            
            # 回复邮件
            reply_subject = f"Re: {subject}"
            reply_body = f"""
Hi，这是 Frankie 的自动回复～ 🎃

你的问题：
{body}

根据我的 Wiki 记录：
{answer}

---
这是自动生成的回复，如有疑问请直接联系我的主人。
"""
            execute_send_email(sender, reply_subject, reply_body)
            
            # 标记为已读
            imap.store(msg_id, '+FLAGS', '\\Seen')
        
        time.sleep(60)  # 每分钟检查一次
```

---

### 5.2 Webhook 通知

#### 场景：接入 Slack / Discord

**用户**："每次 Wiki 新增页面，通知到 Slack 频道"

```python
def notify_slack(message: str):
    """发送 Slack 消息"""
    import httpx
    
    webhook_url = settings.integrations.slack_webhook
    
    httpx.post(webhook_url, json={
        "text": message,
        "username": "Frankie Bot",
        "icon_emoji": ":jack_o_lantern:"
    })

# 在 ingest 完成后调用
async def ingest(...):
    # ... 原有逻辑 ...
    
    if settings.integrations.slack_enabled:
        notify_slack(f"📚 新增 Wiki 页面：[[{wiki_page}]]")
```

---

### 5.3 RSS Feed 生成

#### 场景：让他人订阅你的 Wiki 更新

**实现**：
```python
# api.py
from feedgen.feed import FeedGenerator

@app.get("/rss")
async def wiki_rss_feed():
    """生成 Wiki 的 RSS Feed"""
    from Frankie.vault import list_wiki_notes
    
    fg = FeedGenerator()
    fg.title("Frankie Wiki Updates")
    fg.link(href="https://Frankie.yourdomain.com", rel="alternate")
    fg.description("我的个人知识库更新订阅")
    
    # 最近 20 个页面
    recent_pages = sorted(list_wiki_notes(), key=lambda n: n.path.stat().st_mtime, reverse=True)[:20]
    
    for note in recent_pages:
        fe = fg.add_entry()
        fe.title(note.title)
        fe.link(href=f"https://Frankie.yourdomain.com/wiki/{note.path.stem}")
        fe.description(note.content[:200] + "...")
        fe.pubDate(datetime.fromtimestamp(note.path.stat().st_mtime))
    
    return fg.rss_str(pretty=True)
```

**用户使用**：
```bash
# 在 RSS 阅读器中订阅
https://Frankie.yourdomain.com/rss
```

---

### 5.4 用户间协作（未来扩展）

#### 场景：共享 Wiki 子集

**需求**："我想把 #育儿 相关的笔记分享给妻子，她也能添加内容"

**实现思路**（超出 MVP，记录备选）：
1. 创建"共享 Vault"：基于 tag 筛选的虚拟视图
2. 生成邀请链接，对方注册后可访问
3. 双向同步：对方添加的笔记合并回主 Wiki

**技术方案**：
- 后端：多用户账号系统 + 权限管理
- 同步：CRDTs（冲突自由数据类型）或 Git 合并策略
- 前端：协作编辑界面

---

## 六、配置文件扩展

### 6.1 Email 配置

**`config/settings.toml`** 新增：
```toml
[email]
enabled = false
smtp_server = "smtp.gmail.com"
smtp_port = 587
username = "your_email@gmail.com"
password = ""  # 从 .env 读取
from_address = "Frankie <Frankie@yourdomain.com>"

[email.auto_reply]
enabled = false
imap_server = "imap.gmail.com"
check_interval = 60  # 秒
```

**`.env`** 新增：
```
EMAIL_PASSWORD=your_app_password
BRAVE_API_KEY=your_brave_search_key
WEATHER_API_KEY=your_openweathermap_key
```

### 6.2 Integrations 配置

```toml
[integrations]
slack_enabled = false
slack_webhook = ""

discord_enabled = false
discord_webhook = ""

rss_enabled = true  # 生成 RSS feed
```

---

## 七、开发路线图

### 时间线

```
Week 1-2: Phase 1 - 时间感知
  ├─ timeline.py 实现
  ├─ 时间上下文注入
  ├─ frankie timeline 命令
  └─ 测试与打磨

Week 3-4: Phase 2 - 主动任务
  ├─ daemon.py 守护进程
  ├─ 定时任务注册（晨间摘要、周报）
  ├─ 通知系统（系统通知 + CLI 提示）
  └─ 测试与打磨

Week 5-7: Phase 3 - 工具调用
  ├─ tools.py 框架
  ├─ 内置工具实现（搜索、天气、邮件）
  ├─ MCP 集成
  ├─ Wiki 分享功能
  └─ 测试与打磨
```

### 里程碑

| 里程碑 | 交付物 | 验收标准 |
|-------|--------|---------|
| M1: 时间感知 | timeline 系统 | Frankie 能说"3 天前"、自动提醒闲置 |
| M2: 主动任务 | daemon 守护进程 | 每天收到晨间摘要、周报自动生成 |
| M3: 工具调用 | tools 框架 + 4 个工具 | Frankie 能搜索、查天气、发邮件 |

---

## 八、风险与应对

### 8.1 技术风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 守护进程稳定性 | 长期运行崩溃 | 监控 + 自动重启脚本 |
| 邮件账号安全 | 密码泄露 | 用 App Password，不存明文 |
| 工具调用滥用 | 自动发垃圾邮件 | require_confirmation + 频率限制 |
| MCP API 变动 | 工具失效 | 兼容层 + 降级方案 |

### 8.2 用户体验风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 通知过于频繁 | 用户关闭功能 | 可配置频率，默认保守 |
| 工具权限担忧 | 不敢用邮件工具 | 明确提示、每次确认 |
| 时间线隐私 | 行为被记录 | 本地存储，用户可删除 |

---

## 九、开发检查清单

### Phase 1 Checklist

- [ ] 创建 `src/frankie/timeline.py`
- [ ] 实现 `record_event()` 函数
- [ ] 在 `agent.py` 中插桩（chat/ingest/query）
- [ ] 实现 `_build_time_context()` 注入 System Prompt
- [ ] 实现 `frankie timeline` 命令
- [ ] Chat 启动时检查闲置天数并提醒
- [ ] 测试：运行一周，验证时间感知效果
- [ ] 文档：更新 README

### Phase 2 Checklist

- [ ] 创建 `src/frankie/daemon.py`
- [ ] 实现 `start_daemon()` 主循环
- [ ] 实现 `morning_summary()` 任务
- [ ] 实现 `weekly_report()` 任务
- [ ] 实现系统通知（macOS/Linux/Windows）
- [ ] 实现 `.frankie/notifications.json` 管理
- [ ] 实现 `frankie daemon start/stop/status` 命令
- [ ] Chat 启动时显示未读通知
- [ ] 测试：运行一周，验证定时任务
- [ ] 文档：守护进程使用说明

### Phase 3 Checklist

- [ ] 创建 `src/frankie/tools.py`
- [ ] 实现工具注册与动态加载
- [ ] 实现 `web_search` 工具（DuckDuckGo + Brave）
- [ ] 实现 `get_weather` 工具
- [ ] 实现 `send_email` 工具
- [ ] 实现 `share_wiki_page` 工具
- [ ] `llm.py` 增加 `chat_with_tools()` 方法
- [ ] 实现工具调用确认机制
- [ ] 实现 `frankie tools` 命令
- [ ] 测试：端到端工具调用
- [ ] 文档：工具使用说明

---

## 十、成功指标

### 10.1 定量指标

| 指标 | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| 用户活跃度 | 时间感知准确率 > 95% | 通知送达率 > 90% | 工具调用成功率 > 85% |
| 用户满意度 | "时间提醒有用" 反馈 > 70% | "主动推送不烦" > 60% | "工具很方便" > 75% |
| 功能使用率 | `frankie timeline` 日均调用 > 1 | 通知点击率 > 40% | 工具日均调用 > 2 |

### 10.2 定性反馈

**验证问题**：
- Phase 1: 用户是否觉得 Frankie "有记忆"？
- Phase 2: 用户是否期待每天的晨间摘要？
- Phase 3: 用户是否主动让 Frankie 帮忙搜索/发邮件？

---

## 十一、参考资源

### 11.1 技术文档

- **Anthropic MCP**：https://docs.anthropic.com/claude/docs/tool-use
- **Schedule (Python)**：https://schedule.readthedocs.io/
- **DuckDuckGo API**：https://duckduckgo.com/api
- **Brave Search API**：https://brave.com/search/api/
- **OpenWeatherMap**：https://openweathermap.org/api

### 11.2 相关项目

- **n8n**：开源工作流自动化（参考其 Email/Webhook 节点设计）
- **Zapier**：商业自动化平台（参考其触发器逻辑）
- **Home Assistant**：智能家居（参考其定时任务和通知机制）

---

## 结语

**核心理念**：从"问答机器"到"主动伙伴"

通过时间感知、主动任务和工具调用，Frankie 不再是一个被动等待指令的工具，而是真正理解用户节奏、主动提供帮助、能与外界交互的智能助手。

**行动口号**：
> 🔮 **让 Frankie 感知时间，主动思考，连接世界！**

---

**附录：`.frankie/tools_config.json` 完整示例**

```json
{
  "version": 1,
  "enabled_tools": [
    "web_search",
    "get_weather",
    "send_email",
    "share_wiki_page"
  ],
  "tool_settings": {
    "web_search": {
      "provider": "brave",
      "max_results": 3,
      "safe_search": true
    },
    "get_weather": {
      "default_city": "北京",
      "units": "metric"
    },
    "send_email": {
      "require_confirmation": true,
      "rate_limit": 10,
      "rate_limit_period": 3600
    },
    "share_wiki_page": {
      "default_expire_days": 7,
      "max_active_shares": 20
    }
  },
  "integrations": {
    "slack": {
      "enabled": false,
      "webhook_url": "",
      "notify_on_ingest": true,
      "notify_on_milestone": true
    },
    "discord": {
      "enabled": false,
      "webhook_url": ""
    }
  }
}
```
