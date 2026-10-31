# frontend-arca

Interfaz del Sistema de Gestión Humana de ARCA Ltda. React + TypeScript + Vite. Solo habla con el API Gateway (`VITE_API_URL`, por defecto `http://localhost:8080`).

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
```
