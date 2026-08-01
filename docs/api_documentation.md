# Documentación de APIs para Integración Frontend

Esta guía detalla todas las APIs REST de nuestro backend para su implementación en el Frontend, incluyendo las cabeceras requeridas, formatos de datos, cuerpos de peticiones y respuestas exitosas.

---

## 🔑 Autenticación (Auth)

### 1. Iniciar Sesión (Login)
* **Endpoint:** `POST /auth/login`
* **Content-Type:** `application/json`
* **Cuerpo de la Petición:**
  ```json
  {
    "email": "admin@admin.com",
    "password": "admim123"
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "84c8a2b5-e6a3-4a18-9be5-9a84dcd24a1b",
      "name": "Administrador",
      "email": "admin@admin.com",
      "roles": ["Admin"]
    }
  }
  ```

---

## 🌾 Módulo de Inventario

> [!NOTE]
> Todos los endpoints de este módulo requieren la cabecera `Authorization: Bearer <TOKEN_JWT>`.

### 2. Registrar Nueva Variedad de Arroz
* **Endpoint:** `POST /inventory/varieties`
* **Permiso requerido:** `create:variety`
* **Content-Type:** `application/json`
* **Cuerpo de la Petición:**
  ```json
  {
    "name": "Carolina",
    "description": "Grano extra largo seleccionado de alta calidad"
  }
  ```
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Carolina",
    "description": "Grano extra largo seleccionado de alta calidad"
  }
  ```

### 3. Listar Variedades de Arroz
* **Endpoint:** `GET /inventory/varieties`
* **Permiso requerido:** `view:inventory`
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Carolina",
      "description": "Grano extra largo seleccionado de alta calidad"
    }
  ]
  ```

### 4. Registrar Entrada de Nuevo Lote (Stock Inicial)
* **Endpoint:** `POST /inventory/lots`
* **Permiso requerido:** `create:lot`
* **Content-Type:** `multipart/form-data`
* **Campos del FormData:**
  - `lotNumber`: `"LOTE-2026-001"` (Texto)
  - `items`: `"[{\"varietyId\":\"a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d\",\"quantityInitial\":120,\"pricePerQuintal\":28.5}]"` (Texto JSON serializado)
  - `receipt`: Archivo multimedia (Imagen o PDF de la factura/comprobante)
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "99f36f9a-a48f-4d37-88df-b59a84a6c8e9",
    "lotNumber": "LOTE-2026-001",
    "receiptUrl": "http://localhost:9000/gestion-ventas/lots/1722473489123-factura.pdf",
    "createdAt": "2026-07-31T21:15:00.000Z",
    "items": [
      {
        "id": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "varietyName": "Carolina",
        "quantityInitial": 120,
        "quantityCurrent": 120,
        "pricePerQuintal": 28.5
      }
    ]
  }
  ```

### 5. Registrar Movimiento de Stock (Mermas / Ajustes manuales)
* **Endpoint:** `POST /inventory/movements`
* **Permiso requerido:** `register:movement`
* **Content-Type:** `multipart/form-data`
* **Campos del FormData:**
  - `lotItemId`: `"77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a"` (Texto, ID específico del lote-variedad)
  - `type`: `"OUTPUT"` o `"INPUT"` (Texto)
  - `quantity`: `5` (Número)
  - `reason`: `"Merma por humedad"` (Texto)
  - `attachment`: Archivo multimedia (Opcional, imagen o PDF)
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "b3f36a5a-8b1e-450f-90ef-cbafae774431",
    "lotItemId": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
    "type": "OUTPUT",
    "quantity": 5,
    "reason": "Merma por humedad",
    "registeredById": "84c8a2b5-e6a3-4a18-9be5-9a84dcd24a1b",
    "attachmentUrl": "http://localhost:9000/gestion-ventas/movements/172247351000-foto.jpg",
    "createdAt": "2026-07-31T21:16:00.000Z"
  }
  ```

### 6. Ver Estado de Inventario y Consolidado
* **Endpoint:** `GET /inventory`
* **Permiso requerido:** `view:inventory`
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "summary": [
      {
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Carolina",
        "description": "Grano extra largo seleccionado de alta calidad",
        "totalStock": 115
      }
    ],
    "lots": [
      {
        "id": "99f36f9a-a48f-4d37-88df-b59a84a6c8e9",
        "lotNumber": "LOTE-2026-001",
        "receiptUrl": "http://localhost:9000/gestion-ventas/lots/1722473489123-factura.pdf",
        "createdAt": "2026-07-31T21:15:00.000Z",
        "items": [
          {
            "id": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
            "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "varietyName": "Carolina",
            "quantityInitial": 120,
            "quantityCurrent": 115,
            "pricePerQuintal": 28.5
          }
        ]
      }
    ]
  }
  ```

---

## 🛍️ Módulo de Ventas, Reservas y Devoluciones

> [!NOTE]
> Todos los endpoints de este módulo requieren la cabecera `Authorization: Bearer <TOKEN_JWT>`.

### 7. Registrar Venta Directa
* **Endpoint:** `POST /sales`
* **Permiso requerido:** `create:sale`
* **Content-Type:** `multipart/form-data`
* **Campos del FormData:**
  - `items`: `"[{\"varietyId\":\"a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d\",\"quantity\":10}]"` (Texto JSON serializado). Opcional: pasar `lotItemId` para elegir lote de forma manual, y/o `pricePerUnit` para precio personalizado. Si no se pasa `lotItemId`, aplicará **FIFO** automáticamente.
  - `paymentMethod`: `"CASH"` | `"QR"` | `"TRANSFER"` | `"MIXED"` (Texto)
  - `cashAmount`: `100` (Número, Requerido si es MIXED o CASH)
  - `qrAmount`: `185` (Número, Requerido si es MIXED o QR)
  - `transferAmount`: `0` (Número, Requerido si es MIXED o TRANSFER)
  - `proof`: Archivo multimedia (Comprobante de pago. Obligatorio si el método es QR, TRANSFER, o MIXED con montos en estos métodos)
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f",
    "saleNumber": "V-12345678",
    "registeredById": "84c8a2b5-e6a3-4a18-9be5-9a84dcd24a1b",
    "totalPrice": 285.00,
    "status": "COMPLETED",
    "createdAt": "2026-07-31T21:20:00.000Z",
    "items": [
      {
        "id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "varietyName": "Carolina",
        "lotItemId": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
        "quantity": 10,
        "pricePerUnit": 28.5,
        "subtotal": 285.00
      }
    ],
    "payments": [
      {
        "id": "d6f7e8a9-b0c1-2e3f-4a5b-6c7d8e9f0a1b",
        "paymentMethod": "MIXED",
        "cashAmount": 100.00,
        "qrAmount": 185.00,
        "transferAmount": 0.00,
        "totalPaid": 285.00,
        "proofUrl": "http://localhost:9000/gestion-ventas/payments/172247352000-qr_comprobante.png"
      }
    ]
  }
  ```

### 8. Registrar Nueva Reserva (con pago parcial)
* **Endpoint:** `POST /sales/reservations`
* **Permiso requerido:** `create:reservation`
* **Content-Type:** `multipart/form-data`
* **Campos del FormData:**
  - `customerName`: `"Carlos Rojas"` (Texto)
  - `customerPhone`: `"77112233"` (Texto, Opcional)
  - `items`: `"[{\"varietyId\":\"a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d\",\"quantity\":20}]"` (Texto JSON serializado)
  - `paymentMethod`: `"CASH"` | `"QR"` | `"TRANSFER"` | `"MIXED"` (Texto)
  - `downPayment`: `100` (Número, adelanto pagado)
  - `cashAmount`: `100` (Número, Requerido si es MIXED o CASH)
  - `qrAmount`: `0`
  - `transferAmount`: `0`
  - `proof`: Archivo multimedia (Comprobante del adelanto, si aplica)
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "f8a9b0c1-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
    "reservationNumber": "R-87654321",
    "customerName": "Carlos Rojas",
    "customerPhone": "77112233",
    "status": "PENDING",
    "registeredById": "84c8a2b5-e6a3-4a18-9be5-9a84dcd24a1b",
    "totalPrice": 570.00,
    "createdAt": "2026-07-31T21:22:00.000Z",
    "items": [
      {
        "id": "1a2b3c4d-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "quantity": 20,
        "pricePerUnit": 28.5,
        "subtotal": 570.00
      }
    ],
    "payments": [
      {
        "id": "2b3c4d5e-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "paymentMethod": "CASH",
        "cashAmount": 100.00,
        "qrAmount": 0.00,
        "transferAmount": 0.00,
        "totalPaid": 100.00,
        "proofUrl": null
      }
    ]
  }
  ```

### 9. Registrar Recogida de Reserva (pago de saldo restante y entrega)
* **Endpoint:** `POST /sales/reservations/:id/pickup`
* **Permiso requerido:** `pickup:reservation`
* **Content-Type:** `multipart/form-data`
* **Campos del FormData:**
  - `paymentMethod`: `"CASH"` | `"QR"` | `"TRANSFER"` | `"MIXED"`
  - `cashAmount`: `470` (Monto restante en efectivo)
  - `qrAmount`: `0`
  - `transferAmount`: `0`
  - `proof`: Archivo multimedia (Comprobante de saldo final, si aplica)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "id": "f8a9b0c1-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
    "reservationNumber": "R-87654321",
    "status": "PICKED_UP",
    "totalPrice": 570.00,
    "payments": [
      {
        "id": "2b3c4d5e-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "paymentMethod": "CASH",
        "cashAmount": 100.00,
        "qrAmount": 0.00,
        "transferAmount": 0.00,
        "totalPaid": 100.00,
        "proofUrl": null,
        "createdAt": "2026-07-31T21:22:00.000Z"
      },
      {
        "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
        "paymentMethod": "CASH",
        "cashAmount": 470.00,
        "qrAmount": 0.00,
        "transferAmount": 0.00,
        "totalPaid": 470.00,
        "proofUrl": null,
        "createdAt": "2026-07-31T21:25:00.000Z"
      }
    ]
  }
  ```

### 10. Registrar Devolución de Arroz
* **Endpoint:** `POST /sales/returns`
* **Permiso requerido:** `process:return`
* **Content-Type:** `application/json`
* **Cuerpo de la Petición:**
  ```json
  {
    "saleId": "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f",
    "reason": "Cliente solicitó devolución de 2 sacos dañados",
    "items": [
      {
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "lotItemId": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
        "quantity": 2,
        "restock": true
      }
    ]
  }
  ```
  > [!TIP]
  > Si `"restock": true`, la cantidad devuelta volverá de forma automática a sumarse en el lote original correspondiente (`lot_items`), y se registrará un movimiento de inventario de entrada por auditoría.

* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "d5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a",
    "saleId": "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f",
    "reason": "Cliente solicitó devolución de 2 sacos dañados",
    "registeredById": "84c8a2b5-e6a3-4a18-9be5-9a84dcd24a1b",
    "createdAt": "2026-07-31T21:30:00.000Z",
    "items": [
      {
        "id": "e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b",
        "varietyId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "lotItemId": "77f3e8f8-b47a-42cd-99b8-39cbcf44cc4a",
        "quantity": 2
      }
    ]
  }
  ```

### 11. Listar Ventas Registradas
* **Endpoint:** `GET /sales`
* **Permiso requerido:** `view:sales`
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f",
      "saleNumber": "V-12345678",
      "totalPrice": 285.00,
      "status": "RETURNED",
      "createdAt": "2026-07-31T21:20:00.000Z"
    }
  ]
  ```

### 12. Listar Reservas Registradas
* **Endpoint:** `GET /sales/reservations`
* **Permiso requerido:** `view:sales`
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": "f8a9b0c1-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
      "reservationNumber": "R-87654321",
      "customerName": "Carlos Rojas",
      "status": "PICKED_UP",
      "totalPrice": 570.00,
      "createdAt": "2026-07-31T21:22:00.000Z"
    }
  ]
  ```
