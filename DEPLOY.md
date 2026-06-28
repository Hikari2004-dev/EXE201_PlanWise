# PlanWise Docker CI/CD

Mỗi lần push lên nhánh `main`, GitHub Actions sẽ:

1. Build frontend và backend.
2. Build thử cả hai Docker image.
3. SSH vào production server và checkout đúng commit vừa push.
4. Rebuild rồi khởi động stack bằng `docker-compose.prod.yml`.
5. Chờ PostgreSQL, backend và frontend healthy.
6. Tự động quay lại commit trước nếu deploy thất bại.

Pull request vào `main` chỉ chạy CI, không deploy.

## 1. Chuẩn bị server một lần

Yêu cầu: Linux, Git, Docker Engine và Docker Compose v2.

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/planwise
sudo chown deploy:deploy /opt/planwise

sudo -u deploy git clone https://github.com/Hikari2004-dev/EXE201_PlanWise.git /opt/planwise
cd /opt/planwise
cp .env.example .env
```

Điền secret production trong `/opt/planwise/.env`. Tối thiểu phải có:

```dotenv
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<strong-password>
POSTGRES_DB=planwise
JWT_SECRET=<random-secret>
HTTP_PORT=80
VITE_API_BASE_URL=
CORS_ALLOWED_ORIGINS=https://your-domain.example
APP_MAIL_VERIFICATION_BASE_URL=https://your-domain.example/verify-email
VNPAY_RETURN_URL=https://your-domain.example/payment/result
```

Không commit file `.env`.

Khởi động lần đầu:

```bash
cd /opt/planwise
docker compose -f docker-compose.prod.yml up -d --build --wait
```

## 2. Cấu hình GitHub Actions

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React + Vite dev server |
| Backend | 8080 | Spring Boot API |

> **Note:** PostgreSQL must be running locally on port 5432 (or update `SPRING_DATASOURCE_URL` in `be/.env` to point to your existing database).

Repository Variables:

| Tên | Ví dụ |
|---|---|
| `DEPLOY_HOST` | `203.0.113.10` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/opt/planwise` |

Repository Secrets:

| Tên | Nội dung |
|---|---|
| `SSH_PRIVATE_KEY` | Private key dùng riêng cho GitHub Actions |
| `SSH_KNOWN_HOSTS` | Kết quả `ssh-keyscan -H <server>`; có thể bỏ trống để workflow tự quét |

Thêm public key tương ứng vào `/home/deploy/.ssh/authorized_keys` trên server.

Nên tạo GitHub Environment tên `production` và bật required reviewers nếu muốn duyệt thủ công trước khi deploy.

## 3. Vận hành

Push lên `main` để deploy tự động, hoặc vào Actions → `CI/CD - Docker Deploy` → `Run workflow`.

```bash
cd /opt/planwise
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

Production Compose dùng PostgreSQL bên ngoài theo `SPRING_DATASOURCE_URL` trong `.env`; workflow không chỉnh sửa hoặc xóa database khi deploy/rollback. File `docker-compose.yml` vẫn dành cho môi trường local cần chạy PostgreSQL bằng Docker.
