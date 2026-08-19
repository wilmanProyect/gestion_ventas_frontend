# Guía de Integración Frontend: Gestión de Sucursales

Esta guía detalla los cambios, endpoints y flujos de pantallas necesarios para que el frontend (`gestion_ventas_frontend`) implemente el módulo de sucursales y su asociación con los lotes de inventario.

---

## 1. Módulo CRUD de Sucursales

Se requiere implementar una pantalla de administración de **Sucursales** (con permisos de visualización `branches:read` y gestión `branches:create`, `branches:update`, `branches:delete`).

### Endpoints Disponibles

#### A. Obtener listado de sucursales
* **Método:** `GET`
* **Ruta:** `/branches`
* **Respuesta (Array):**
  ```json
  [
    {
      "id": "da2c1df5-0d0b-486c-85a0-e5bf397ee482",
      "name": "Sucursal Central",
      "address": "Av. Principal #123, Ciudad",
      "isActive": true
    }
  ]
  ```
  > [!NOTE]
  > El backend filtra automáticamente las sucursales eliminadas lógicamente, por lo que este endpoint retorna únicamente las sucursales vigentes (sean activas o inactivas).

#### B. Obtener detalle de una sucursal
* **Método:** `GET`
* **Ruta:** `/branches/:id`

#### C. Crear una sucursal
* **Método:** `POST`
* **Ruta:** `/branches`
* **Payload:**
  ```json
  {
    "name": "Sucursal Sur",
    "address": "Calle 45 #890"
  }
  ```
  > [!IMPORTANT]
  > El backend inicializa `isActive: true` de forma automática. No debes enviar esta propiedad al crear.

#### D. Actualizar información de una sucursal
* **Método:** `PATCH`
* **Ruta:** `/branches/:id`
* **Payload (Parcial/Opcional):**
  ```json
  {
    "name": "Sucursal Sur Modificada",
    "address": "Calle Nueva Dirección #12"
  }
  ```

#### E. Activar / Desactivar sucursal (Status Toggle)
* **Método:** `PATCH`
* **Rutas:**
  * Activar: `/branches/:id/activate`
  * Desactivar: `/branches/:id/deactivate`
* **Respuesta:** Retorna el objeto de la sucursal actualizado.

#### F. Eliminar sucursal (Eliminación Lógica)
* **Método:** `DELETE`
* **Ruta:** `/branches/:id`
* **Respuestas:**
  * **Éxito (200 OK):** `{ "message": "Sucursal eliminada lógicamente con éxito." }`
  * **Error por Stock Activo (400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "message": "La sucursal no puede eliminarse porque aún tiene lotes con stock disponible."
    }
    ```
    > [!WARNING]
    > Debes capturar este error de validación 400 y mostrar un Toast o modal de advertencia al usuario indicando que no puede eliminar la sucursal si aún posee stock en el inventario.

---

## 2. Asociación de Sucursal en la Creación de Lotes

En el formulario de **Registrar Entrada de Lote** (`POST /inventory/lots`), ahora es **obligatorio** indicar a qué sucursal se destina el lote.

### Cambios Requeridos:

1. **Selector de Sucursal:**
   * Cargar la lista de sucursales usando `GET /branches`.
   * Filtrar localmente en el frontend para mostrar únicamente las sucursales donde `isActive === true`. Las sucursales inactivas no deben ser seleccionables.
2. **Envío de Datos (Multipart Form-Data):**
   * El endpoint `/inventory/lots` recibe la petición en formato `multipart/form-data` debido a la carga del comprobante/factura en PDF o imagen.
   * Debes agregar el campo `branchId` (UUID) en el cuerpo del formulario (`FormData`).
   * Ejemplo de construcción de la petición en React/Vue/Svelte:
     ```typescript
     const formData = new FormData();
     formData.append('lotNumber', lotData.lotNumber);
     formData.append('branchId', lotData.branchId); // <--- NUEVO CAMPO OBLIGATORIO
     formData.append('receipt', lotData.receiptFile); // Archivo del comprobante
     formData.append('items', JSON.stringify(lotData.items)); // Array de ítems (varietyId, quantityInitial, pricePerQuintal)
     ```

---

## 3. Cambios en la Visualización del Inventario

El backend ahora incluye la propiedad `branchId` en la respuesta de la creación y consultas de lotes:

```json
{
  "id": "lote-uuid",
  "lotNumber": "LOTE-001",
  "receiptUrl": "...",
  "branchId": "da2c1df5-0d0b-486c-85a0-e5bf397ee482", // <--- NUEVO CAMPO
  "createdAt": "2026-08-18T20:00:00.000Z",
  "items": [...]
}
```

* **Visualización:** Añadir en las tarjetas de stock o listado de lotes una etiqueta que muestre la sucursal destino. Si el frontend ya tiene cargado el listado de sucursales en un estado/store global, puedes mapear el `branchId` con el nombre de la sucursal correspondiente de forma rápida.
