# Deploy — DLU Líquidos (VPS producción)

## 1. Datos del servidor

| Dato | Valor |
|---|---|
| IP del VPS | `76.13.233.243` |
| Dominio | `dlu-liquidos.hswaretecnologia.com` |
| Ruta del repo en el VPS | `/root/produccion/clientes/dlu_liquidos` |
| Puerto asignado (frontend) | `8087` (siguiente libre tras revisar `docker ps`) |
| Reverse proxy | nginx del host (fuera de Docker) |
| SSL | Cloudflare, proxy activado, modo Full |

`db` y `backend` no publican ningún puerto al host — solo se hablan por la red interna de Docker Compose (mismo patrón que `hsware_global`).

## 2. Variables de entorno

```bash
cd /root/produccion/clientes/dlu_liquidos
cp .env.example .env
nano .env
```

Completar `POSTGRES_PASSWORD`, `JWT_SECRET` y `TRACKING_SECRET` (usados por el backend para JWT y para cifrado AES de tracking). Generar valores fuertes:

```bash
openssl rand -hex 32
```

⚠️ `POSTGRES_PASSWORD` va embebido en una connection string URL — usar **solo caracteres hex** (`openssl rand -hex 24`), nunca `openssl rand -base64` (genera `/`, `+`, `=` que rompen el parseo de la URL con error `P1013`).

También completar las variables SMTP para la recuperación de contraseña por email:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=contraseña-de-aplicación-de-16-dígitos   # NO la contraseña normal de Gmail
SMTP_FROM=DLU Líquidos <tu-correo@gmail.com>
```

La contraseña de aplicación se genera en la cuenta de Google: `myaccount.google.com/apppasswords` (requiere 2FA activado en esa cuenta de Gmail).

## 3. Levantar

```bash
cd /root/produccion/clientes/dlu_liquidos
docker compose up -d --build
docker compose ps
```

Las migraciones de Prisma corren solas al arrancar el backend (`npx prisma migrate deploy && npm start`).

## 4. Nginx del host

```bash
cp deploy/nginx-dlu-liquidos.conf /etc/nginx/sites-available/dlu-liquidos
ln -s /etc/nginx/sites-available/dlu-liquidos /etc/nginx/sites-enabled/dlu-liquidos
nginx -t && systemctl reload nginx
```

## 5. Cloudflare

Registro DNS `dlu-liquidos` → `76.13.233.243`, proxy activado (nube naranja), SSL en modo **Full**.

## 6. Primer usuario (seed, no register)

Este proyecto **no tiene un endpoint público de registro** (a diferencia de `hsware_global`) — los usuarios se crean con un script de seed (`backend/prisma/seed.ts`) que da de alta 6 cuentas fijas, todas con la misma contraseña temporal:

| Nombre | Email | Rol |
|---|---|---|
| Administrador | admin@dluliquidos.com | SUPERADMIN |
| Alan Gandarillas | tecnicogandarillas@gmail.com | SUPERADMIN |
| Ximena | ximena@dluliquidos.com | LOGISTICA |
| Carolina | carolina@dluliquidos.com | OPERACIONES |
| Karla | karla@dluliquidos.com | CONCILIACIONES |
| Miguel | miguel@dluliquidos.com | GERENTE |
| Finanzas | finanzas@dluliquidos.com | FINANZAS |

Contraseña temporal para las 6: `CambiarAhora2026!` (cambiar cada una en el primer login real).

Correr el seed dentro del contenedor (no hay script `prisma:seed` en `package.json`, se llama `tsx` directo):

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

Es seguro correrlo más de una vez (usa `upsert`, no duplica usuarios).

## 7. Diagnóstico

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
curl -I http://127.0.0.1:8087
```

## 8. Actualizar

```bash
cd /root/produccion/clientes/dlu_liquidos
git pull
docker compose up -d --build
```
