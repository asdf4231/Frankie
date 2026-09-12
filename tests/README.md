# Frankie 测试

安装测试与 Web 依赖后运行：

```bash
pip install -e ".[dev,web]"
pytest
```

测试使用临时目录和模拟模型响应，不调用真实 LLM API，也不修改用户数据。

## 覆盖范围

- CLI 查询和对话、知识库读取、运行时目录隔离
- Web 问答提示、课程页面浏览和引用解析
- 结构化检索工具调用和上下文续接
- 对话历史、附件、流式失败和取消后的持久化
- 长对话压缩时的工具事务完整性
- 学情接口的管理员鉴权、学生历史只读访问、分页与附件路径边界
- 全班摘要的增量时间边界、并发生成、失败重试、原子保存和长输入分批分析

## 烟雾测试

```bash
frankie-smoke
# 或
pytest tests/test_smoke.py -v
python tests/test_smoke.py
```
