# 🚀 LinkeoGes – ERP & CRM Integral para Tarjetas Inteligentes NFC

Plataforma integral de gestión operativa, comercial, logística y financiera diseñada para **Linkeo** ([linkeocards.com](https://linkeocards.com/)).

Desarrollada para la dirección y operación conjunta de **Luis Romero** & **Kevin Servat** (Co-Fundadores & Co-CEOs al 50/50).

---

## 🌟 Módulos y Capacidades

1. **Dashboard Ejecutivo & Finanzas 50/50:**
   - Conciliación de ingresos, gastos compartidos y liquidación de reembolsos en tiempo real.
   - Meta mensual de utilidad: S/ 4,000 netos (75 unidades).
   - Cálculo automático de split 50/50 por socio.
   - Exportación completa a Excel (.xlsx) con un solo clic.

2. **Trazabilidad & Stock NFC:**
   - Registro de tarjetas físicas por UID, lote, modelo y URL grabada (Google Place ID).
   - Verificación de estado de grabación, pruebas de lectura NDEF y cliente asignado.

3. **Pipeline de Ventas B2B (Kanban):**
   - Gestión de prospectos por etapas: *Nuevo Prospecto*, *Contactado*, *Muestra Entregada*, *Negociación / Cotizado*, *Cerrado Ganado*, *Perdido*.
   - Vinculación geográfica por distritos de Lima.

4. **Inventario Crítico & Cadena de Suministros:**
   - Control de insumos base (chips NTAG215, displays acrílicos en L, tarjetas PVC, empaques).
   - Alertas preventivas por quiebre de stock considerando tiempos de importación (18 días de tránsito).

5. **Agenda Operativa & Rutas de Prospección:**
   - Programación de reuniones, visitas presenciales en campo y liquidaciones semanales entre socios.
   - Enrutamiento inteligente con apertura directa a Google Maps y Waze.

6. **Ciclo de Vida del Proyecto ERP (5 Fases PMBOK):**
   - 1. Inicio & Kickoff
   - 2. Planificación Operativa & Financiera
   - 3. Implementación Comercial & Técnica
   - 4. Monitoreo, Control & Auditoría
   - 5. Cierre & Escalamiento

7. **Bitácora Universal de Auditoría:**
   - Registro inmutable de creaciones, modificaciones y eliminaciones con usuario responsable, motivo del cambio y fecha/hora exacta.

## Precios NFC vigentes

- Modelos individuales: S/35 por unidad.
- Packs: Restaurante Dúo S/60, Trío S/85, Emprendedor S/55, Negocio S/60,
  Dúo Premium S/60 y Full S/85.
- El precio regular de los packs se calcula con sus componentes a S/35 por unidad;
  se conserva el ahorro nominal vigente de cada promoción.
- La migración `supabase/migrations/202610200002_nfc_price_update_35.sql`
  actualiza el catálogo central y debe ejecutarse en Supabase para sincronizar
  Gestión, la web y las herramientas de ventas.

---

## 🛠️ Tecnologías

- **Frontend:** React 19 + Vite 6
- **Estilos:** Vanilla CSS / Modern Glassmorphism Design System (Modo Dark tech por defecto)
- **Iconografía:** Lucide React
- **Exportación de Datos:** XLSX (SheetJS) + Respaldo íntegro JSON
- **Persistencia & Sincronización:** Supabase PostgreSQL con procedimientos transaccionales (`linkeoges_commit`), Row Level Security (RLS) y motor optimista `SyncEngine` con bloqueo de revisiones e idempotencia
- **Autenticación:** Supabase Auth con cuentas individuales para socios
- **Testing:** Suite automatizada con Node.js Test Runner, PGlite (PostgreSQL real en memoria) y Playwright E2E
- **Despliegue:** Vercel

---

## 💻 Inicio Rápido en Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/soylinkeo/LinkeoGes.git
cd LinkeoGes

# 2. Instalar dependencias
npm install

# 3. Ejecutar verificaciones de código y pruebas (Linter + PGlite DB Tests + Build)
npm run check

# 4. Ejecutar pruebas de navegador E2E (concurrencia y sincronización)
npm run test:browser

# 5. Iniciar servidor de desarrollo
npm run dev
```

---

## 🔐 Acceso Autorizado & Seguridad

El sistema implementa autenticación individual y segura mediante **Supabase Auth**:

- **Luis Romero:** `luis@linkeocards.com` (Contraseña individual >= 12 caracteres)
- **Kevin Servat:** `kevin@linkeocards.com` (Contraseña individual >= 12 caracteres)

> Para instrucciones completas de migración SQL, variables de entorno en Vercel y activación de usuarios, consulta la guía detallada en [DEPLOYMENT.md](DEPLOYMENT.md).

---

© 2026 Linkeo. Todos los derechos reservados.
