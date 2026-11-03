# frontend-arca

Interfaz del Sistema de Gestión Humana de ARCA Ltda. React + TypeScript + Vite. Solo habla con el API Gateway (`VITE_API_URL`, por defecto `http://localhost:8080`).

Requiere **Node 22 o superior**.

## Estructura

```
src/
  components/      componentes reutilizables
  features/        un módulo por área: auth, personal, vacaciones, contratos, boletas, auditoria
    <modulo>/components/  index.ts
  services/api.ts  llamadas al gateway
  types/           tipos compartidos
```

## Comandos

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:5173
npm run build
npm run lint
npm run typecheck
npm run format:check
```

## Login

- `/login` muestra el formulario y los errores del backend.
- `/` es una ruta protegida; sin sesión redirige a `/login`.
- El token y el usuario se guardan en `localStorage`; “Cerrar sesión” los elimina.
- Los módulos del inicio se muestran según el rol (`ADMIN`, `RRHH`, `DIRECCION`, `FUNCIONARIO`).
- Los usuarios de demo están en el README de `backend-arca` y en `docs/Sprints/1/HU5/HU-05-login.md`.

## Docker

El `Dockerfile` construye la SPA y la sirve con Nginx. El `docker-compose.yml` del repo `backend-arca` lo levanta en `http://localhost:5173`; el build acepta `VITE_API_URL` como argumento.
