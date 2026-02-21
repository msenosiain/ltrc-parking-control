# Bruno API Collection - Parking Control

Esta carpeta contiene las configuraciones de Bruno para probar la API de Parking Control.

## Estructura

```
bruno/
├── bruno.json              # Configuración de la colección
├── collection.bru          # Variables de colección
├── environments/
│   ├── local.bru           # Environment local (localhost:3000/api/v1)
│   └── render.bru          # Environment Render (producción)
├── health/
│   └── health-check.bru    # Health check de la API
├── members/
│   └── get-members.bru     # Endpoints de miembros
├── parking/
│   └── get-parking-status.bru  # Endpoints de parking
└── access/
    └── get-access-log.bru  # Endpoints de access
```

## Cómo usar

1. Abre Bruno y selecciona "Open Collection"
2. Navega a la carpeta `bruno/` de este proyecto
3. Selecciona el environment deseado:
   - **local**: Para desarrollo local (`http://localhost:3000/api/v1`)
   - **render**: Para producción en Render (`https://parking-control-api.onrender.com/api/v1`)

## Environments

### Local
- URL base: `http://localhost:3000/api/v1`
- Usar cuando la API está corriendo localmente con `npx nx serve api`

### Render
- URL base: `https://parking-control-api.onrender.com/api/v1`
- Usar para probar la API desplegada en Render

## Endpoints disponibles

### Members
- `GET /members` - Lista paginada de miembros
- `GET /members/:dni` - Buscar miembro por DNI
- `POST /members` - Crear miembro
- `PUT /members/:id` - Actualizar miembro
- `DELETE /members/:id` - Eliminar miembro
- `POST /members/upload` - Cargar miembros desde Excel

### Parking
- `GET /parking/status` - Estado del estacionamiento
- `POST /parking/enter` - Registrar entrada de auto
- `POST /parking/leave` - Registrar salida de auto

### Access
- `POST /access` - Registrar acceso por DNI

### Auth
- `GET /auth/google` - Iniciar OAuth con Google
- `POST /auth/refresh` - Refrescar token

## Configuración de autenticación

Para los endpoints que requieren autenticación, configura la variable `accessToken` con un token JWT válido en las variables de la colección.
