# PlanWise - Hướng dẫn CI/CD Auto Deploy

## Tổng quan

Mỗi lần push code lên nhánh `main`, GitHub Actions sẽ tự động:

1. Tạo file `.env` từ GitHub Secrets
2. SCP toàn bộ source code lên VPS
3. Build Docker images (backend + frontend)
4. Khởi động stack bằng `docker-compose.prod.yml`

Database PostgreSQL đã có sẵn trên server, không chạy trong container.

## Kiến trúc

```
Client :3000 → Nginx (frontend) → /api/* → Backend :8000 → PostgreSQL (external)
```

| Service  | Port nội bộ | Port expose |
|----------|-------------|-------------|
| Backend  | 8000        | không (chỉ qua nginx) |
| Frontend | 80          | 3000        |

---

## 1. Yêu cầu trên server

- Linux (Ubuntu/Debian khuyến nghị)
- Docker Engine + Docker Compose v2
- Mở port 3000 (hoặc port bạn chọn cho `HTTP_PORT`)

```bash
# Cài Docker (nếu chưa có)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## 2. Cấu hình GitHub Secrets

Vào repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

### Secrets cho SSH (bắt buộc)

| Secret | Mô tả |
|--------|--------|
| `SERVER_HOST` | IP hoặc domain VPS |
| `SERVER_USER` | User SSH (vd: `root`, `deploy`) |
| `SERVER_SSH_KEY` | Private key SSH (nội dung file `~/.ssh/id_rsa`) |

### Secrets cho ứng dụng (copy từ file `be/.env`)

| Secret | Giá trị mẫu |
|--------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://hikari2004.ddns.net:5417/planwise` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | password DB |
| `JWT_SECRET` | JWT secret key (base64) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `VITE_API_BASE_URL` | URL API production (để trống nếu cùng domain) |
| `R2_ENDPOINT` | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | Tên bucket R2 |
| `R2_PUBLIC_BASE_URL` | R2 public URL |
| `AI_CLAUDE_API_KEY` | API key cho AI |
| `AI_CLAUDE_MODEL` | Model AI (vd: `claude-sonnet-4-6`) |
| `AI_CLAUDE_URL` | URL endpoint AI |
| `VNPAY_RETURN_URL` | URL trả về sau thanh toán VNPay |
| `PAYOS_CLIENT_ID` | PayOS client ID |
| `PAYOS_API_KEY` | PayOS API key |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key |
| `PAYOS_RETURN_URL` | URL trả về sau thanh toán PayOS |
| `PAYOS_CANCEL_URL` | URL khi hủy thanh toán |
| `PAYOS_WEBHOOK_URL` | URL webhook PayOS |

---

## 3. Chuẩn bị server lần đầu

```bash
# Tạo thư mục deploy
sudo mkdir -p /opt/planwise
sudo chown $USER:$USER /opt/planwise
```

Workflow sẽ tự SCP code vào `/opt/planwise` mỗi lần deploy.

---

## 4. Deploy

### Tự động (khuyến nghị)

Push code lên branch `main` → GitHub Actions tự chạy.

### Thủ công (trên server)

```bash
cd /opt/planwise

# Tạo .env file (nếu chưa có)
cp .env.example .env
# Sửa .env với giá trị production

# Build và chạy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Vận hành

```bash
# Xem trạng thái
docker compose -f docker-compose.prod.yml ps

# Xem logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart
docker compose -f docker-compose.prod.yml restart

# Dừng toàn bộ
docker compose -f docker-compose.prod.yml down

# Rebuild lại từ đầu
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

---

## 6. Cấu trúc file

```
├── .github/workflows/deploy.yml   # CI/CD workflow
├── Dockerfile.be                  # Multi-stage build backend (Java 21)
├── Dockerfile.fe                  # Multi-stage build frontend (Node 20 + Nginx)
├── docker-compose.prod.yml        # Production compose (không có DB)
├── docker-compose.yml             # Development compose (có DB)
├── deploy/nginx.conf              # Nginx config (proxy /api/ → backend)
└── be/.env                        # Local env (KHÔNG push lên git)
```

---

## 7. Lưu ý

- **KHÔNG** commit file `.env` lên git
- Database đã có sẵn, backend connect trực tiếp qua `SPRING_DATASOURCE_URL`
- Frontend truy cập tại port `3000`, backend nội bộ tại port `8000`
- Nếu muốn đổi port, set biến `HTTP_PORT` trong secrets/env
- Đảm bảo firewall mở port 3000 trên server
