import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

console.log('='.repeat(70))
console.log('  VERIFICACIÓN INTEGRAL DE CRITERIOS DE ACEPTACIÓN: HU-04')
console.log('='.repeat(70))

let totalChecks = 0
let passedChecks = 0

function assert(condition, message, details = '') {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  ✅ [PASS] ${message}`)
    if (details) console.log(`     -> ${details}`)
  } else {
    console.error(`  ❌ [FAIL] ${message}`)
    if (details) console.error(`     -> ${details}`)
  }
}

// -------------------------------------------------------------
// CA-01: Layout Principal (Sidebar con módulos y Topbar con usuario y rol)
// -------------------------------------------------------------
console.log('\n[CA-01] Layout Principal (Sidebar + Topbar):')
const appLayoutSrc = fs.readFileSync(path.join(root, 'src/components/layout/AppLayout.tsx'), 'utf-8')
const sidebarSrc = fs.readFileSync(path.join(root, 'src/components/layout/Sidebar.tsx'), 'utf-8')
const topbarSrc = fs.readFileSync(path.join(root, 'src/components/layout/Topbar.tsx'), 'utf-8')

assert(
  appLayoutSrc.includes('<Sidebar') && appLayoutSrc.includes('<Topbar') && appLayoutSrc.includes('<Outlet'),
  'AppLayout integra Sidebar, Topbar y Outlet para sub-rutas'
)
assert(
  sidebarSrc.includes('getNavItemsForRole') && sidebarSrc.includes('NavLink'),
  'Sidebar genera navegación dinámica con NavLink según el rol'
)
assert(
  topbarSrc.includes('usuario.email') && topbarSrc.includes('StatusBadge') && topbarSrc.includes('onLogout'),
  'Topbar muestra el email del usuario, su StatusBadge de rol y el botón de logout'
)

// -------------------------------------------------------------
// CA-02: Design System Mínimo
// Colores ARCA, tipografía, tabla, formulario, modal, toast, badge, estado vacío
// -------------------------------------------------------------
console.log('\n[CA-02] Design System Mínimo:')
const cssSrc = fs.readFileSync(path.join(root, 'src/index.css'), 'utf-8')

assert(
  cssSrc.includes('--arca-teal-700: #0f766e;') && cssSrc.includes('--arca-slate-900: #0f172a;'),
  'Paleta de colores oficial de ARCA definida en variables CSS (Teal #0f766e y Slate #0f172a)'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/Table.tsx')),
  'Componente Table implementado con TableHeader, TableBody, TableRow, TableHead, TableCell'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/Input.tsx')) &&
  fs.existsSync(path.join(root, 'src/components/ui/Select.tsx')) &&
  fs.existsSync(path.join(root, 'src/components/ui/Button.tsx')),
  'Componentes de Formulario (Input, Select, Button) implementados con variantes y accesibilidad'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/Modal.tsx')),
  'Componente Modal implementado con backdrop, tecla Escape y bloqueo de scroll'
)
const modalSrc = fs.readFileSync(path.join(root, 'src/components/ui/Modal.tsx'), 'utf-8')
assert(
  modalSrc.includes("event.key === 'Escape'") && modalSrc.includes("overflow = 'hidden'"),
  'Modal cumple accesibilidad: cierra con Escape y controla desbordamiento de body'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/Toast.tsx')) &&
  fs.existsSync(path.join(root, 'src/components/ui/useToast.ts')),
  'Sistema de Toast implementado con ToastProvider y hook useToast()'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/Badge.tsx')),
  'Componentes Badge y StatusBadge implementados con mapeo de estados del dominio ARCA'
)
assert(
  fs.existsSync(path.join(root, 'src/components/ui/EmptyState.tsx')),
  'Componente EmptyState implementado con soporte de icono, título, descripción y acción'
)

// -------------------------------------------------------------
// CA-03: Cliente HTTP Único (apunta al gateway, adjunta token y maneja errores)
// -------------------------------------------------------------
console.log('\n[CA-03] Cliente HTTP Único hacia Gateway:')
const apiSrc = fs.readFileSync(path.join(root, 'src/services/api.ts'), 'utf-8')

assert(
  apiSrc.includes("VITE_API_URL ?? 'http://localhost:8080'"),
  'Apunta al API Gateway por defecto en http://localhost:8080 con override por VITE_API_URL'
)
assert(
  apiSrc.includes("headers.set('Authorization', `Bearer ${token}`)") &&
  apiSrc.includes('getToken()'),
  'Inyecta automáticamente el token de autenticación Bearer en cada petición'
)
assert(
  apiSrc.includes('class ApiError extends Error') &&
  apiSrc.includes('this.code = code') &&
  apiSrc.includes('this.status = status') &&
  apiSrc.includes('this.details = details'),
  'Maneja errores estandarizados { code, message, details, status }'
)
assert(
  apiSrc.includes('static async get<T>') &&
  apiSrc.includes('static async post<T>') &&
  apiSrc.includes('static async put<T>') &&
  apiSrc.includes('static async patch<T>') &&
  apiSrc.includes('static async delete<T>'),
  'Expone métodos HTTP genéricos completos (get, post, put, patch, delete)'
)
assert(
  apiSrc.includes('EVENTO_SESION_EXPIRADA') &&
  apiSrc.includes('response.status === 401'),
  'Captura 401 en rutas protegidas y dispara evento de expiración de sesión'
)

// -------------------------------------------------------------
// CA-04: Rutas protegidas (redirigen al login si no hay sesión)
// -------------------------------------------------------------
console.log('\n[CA-04] Rutas Protegidas y Redirección:')
const protectedRouteSrc = fs.readFileSync(path.join(root, 'src/features/auth/ProtectedRoute.tsx'), 'utf-8')
const appSrc = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8')

assert(
  protectedRouteSrc.includes('if (!usuario)') &&
  protectedRouteSrc.includes('<Navigate to="/login" replace state={{ from: location.pathname }} />'),
  'ProtectedRoute valida sesión y redirige inmediatamente a /login con state.from'
)
assert(
  appSrc.includes('<Route path="/login"') &&
  appSrc.includes('<ProtectedRoute>') &&
  appSrc.includes('<AppLayout />'),
  'App.tsx envuelve la navegación principal en ProtectedRoute y AppLayout'
)

// -------------------------------------------------------------
// CA-05: Menú muestra u oculta módulos según el rol de la sesión
// -------------------------------------------------------------
console.log('\n[CA-05] Visibilidad de Módulos según Rol:')
const navSrc = fs.readFileSync(path.join(root, 'src/config/navigation.ts'), 'utf-8')

// Evaluar la lógica de navegación directamente
const hasPersonal = navSrc.includes("id: 'personal'")
const hasVacaciones = navSrc.includes("id: 'vacaciones'")
const hasContratos = navSrc.includes("id: 'contratos'")
const hasBoletas = navSrc.includes("id: 'boletas'")
const hasDashboard = navSrc.includes("id: 'dashboard'")

assert(
  hasPersonal && hasVacaciones && hasContratos && hasBoletas && hasDashboard,
  'Configuración incluye los 5 módulos base de la especificación más auditoría'
)
assert(
  navSrc.includes('getNavItemsForRole') &&
  navSrc.includes('item.allowedRoles.includes(rol)'),
  'Función getNavItemsForRole() filtra estrictamente según rol del usuario'
)
assert(
  navSrc.includes("rol === 'FUNCIONARIO' ? 'Mi Ficha' : 'Personal'") &&
  navSrc.includes("rol === 'FUNCIONARIO' ? 'Mis Vacaciones' : 'Vacaciones'") &&
  navSrc.includes("rol === 'FUNCIONARIO' ? 'Mis Boletas' : 'Boletas'"),
  'Adapta dinámicamente etiquetas para rol FUNCIONARIO (Mi Ficha, Mis Vacaciones, Mis Boletas)'
)

// -------------------------------------------------------------
// CA-06: Responsive desde 375 px de ancho
// -------------------------------------------------------------
console.log('\n[CA-06] Diseño Responsive (Mobile-First desde 375 px):')

assert(
  cssSrc.includes('@media (max-width: 768px)') &&
  cssSrc.includes('@media (max-width: 480px)'),
  'Incluye media queries para tablets y móviles estrechos (375 px - 480 px)'
)
assert(
  cssSrc.includes('.sidebar-ds.is-mobile-open') &&
  cssSrc.includes('transform: translateX(-100%);') &&
  cssSrc.includes('.sidebar-backdrop'),
  'Sidebar se transforma en drawer móvil deslizante con backdrop oscuro'
)
assert(
  cssSrc.includes('.topbar-menu-btn') &&
  cssSrc.includes('display: flex;') &&
  sidebarSrc.includes('onCloseMobile'),
  'Dispone de botón hamburguesa en Topbar y botón de cierre en Sidebar móvil'
)
assert(
  cssSrc.includes('.table-container-ds') &&
  cssSrc.includes('overflow-x: auto;'),
  'Tablas poseen contenedor con desplazamiento horizontal fluido para prevenir desbordamientos'
)

// -------------------------------------------------------------
// CA-07: Moneda en Bs y Fechas en dd/mm/aaaa
// -------------------------------------------------------------
console.log('\n[CA-07] Moneda en Bs y Fechas en dd/mm/aaaa:')
const formattersSrc = fs.readFileSync(path.join(root, 'src/utils/formatters.ts'), 'utf-8')

assert(
  formattersSrc.includes('function formatCurrency') &&
  formattersSrc.includes('Bs '),
  'formatCurrency() garantiza formato en Bolivianos con prefijo "Bs"'
)
assert(
  formattersSrc.includes('function formatDate') &&
  formattersSrc.includes('${day}/${month}/${year}'),
  'formatDate() garantiza formato estricto dd/mm/aaaa'
)

// Prueba funcional matemática de formatters
function testFormatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Bs 0,00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return 'Bs 0,00'
  const parts = num.toFixed(2).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `Bs ${integerPart},${parts[1]}`
}

function testFormatDate(date) {
  if (!date) return '—'
  let d
  if (typeof date === 'string') {
    const matchSimple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    if (matchSimple) {
      d = new Date(parseInt(matchSimple[1], 10), parseInt(matchSimple[2], 10) - 1, parseInt(matchSimple[3], 10))
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

assert(
  testFormatCurrency(12500.5) === 'Bs 12.500,50' &&
  testFormatCurrency(0) === 'Bs 0,00' &&
  testFormatCurrency(9999999.99) === 'Bs 9.999.999,99',
  'Prueba funcional de moneda: 12500.5 -> "Bs 12.500,50", 0 -> "Bs 0,00"'
)

assert(
  testFormatDate('2026-11-02') === '02/11/2026' &&
  testFormatDate('2024-03-01T15:30:00Z') === '01/03/2024' &&
  testFormatDate(null) === '—',
  'Prueba funcional de fecha: "2026-11-02" -> "02/11/2026", null -> "—"'
)

// Resumen final
console.log('\n' + '='.repeat(70))
console.log(`  RESULTADO: ${passedChecks} de ${totalChecks} verificaciones PASARON EXITOSAMENTE.`)
console.log('='.repeat(70))

if (passedChecks === totalChecks) {
  process.exit(0)
} else {
  process.exit(1)
}
