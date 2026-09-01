#!/usr/bin/env bash
# Frankie 一键部署脚本（阿里云 Linux，Ubuntu/Debian）
#
# 用法：以部署用户身份，在 Frankie 代码仓库根目录执行：
#   bash deploy/setup.sh
#
# 完成后还需：
#   1) 编辑 .env 填入 DEEPSEEK_API_KEY 与 FRANKIE_AUTH_SECRET
#   2) 配置 GitHub 凭据（后台「推送」按钮需要）：HTTPS token 或 SSH key
#   3) 安装 systemd 服务与 nginx 反代（见本目录 frankie.service / nginx.conf）
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> 安装系统依赖"
sudo apt-get update -y
sudo apt-get install -y python3 python3-venv python3-pip git nginx

echo "==> 创建 Python 虚拟环境并安装依赖"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[web]"

echo "==> 构建前端"
if command -v pnpm >/dev/null 2>&1; then
  (cd frontend && pnpm install && pnpm build)
elif command -v npm >/dev/null 2>&1; then
  (cd frontend && npm install && npm run build)
else
  echo "!! 未找到 pnpm/npm，跳过前端构建（若 frontend/dist 已存在可忽略）"
fi

echo "==> 配置 .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "!! 请编辑 .env 填入 DEEPSEEK_API_KEY 和 FRANKIE_AUTH_SECRET"
fi

echo "==> 克隆课程内容仓库（FAQ/进度/Wiki/讲义，git pull 即更新）"
mkdir -p data/content
if [ ! -d data/content/dynamic_optimization_2026/.git ]; then
  git clone https://github.com/JunnanZ/dynamic_optimization_2026.git data/content/dynamic_optimization_2026
else
  (cd data/content/dynamic_optimization_2026 && git pull --ff-only)
fi

echo ""
echo "✅ 基础部署完成。后续步骤："
echo "   1. 编辑 .env 填入密钥"
echo "   2. 配置 GitHub 凭据以启用后台「推送」按钮"
echo "   3. sudo cp deploy/frankie.service /etc/systemd/system/ && sudo systemctl enable --now frankie"
echo "   4. 配置 nginx 反代（参考 deploy/nginx.conf）并 reload"
