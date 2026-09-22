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

---

## 🛠️ Tecnologías

- **Frontend:** React 19 + Vite 6
- **Estilos:** Vanilla CSS / Modern Glassmorphism Design System (Modo Dark tech por defecto)
- **Iconografía:** Lucide React
- **Exportación de Datos:** XLSX (SheetJS)
- **Persistencia:** LocalStorage sincronizado + Preparado para Supabase Cloud Database
- **Despliegue:** Vercel

---

## 💻 Inicio Rápido en Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/soylinkeo/LinkeoGes.git
cd LinkeoGes

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🔐 Acceso Autorizado

- **Luis Romero:** Co-Fundador & Co-CEO (PIN: `2109`)
- **Kevin Servat:** Co-Fundador & Co-CEO (PIN: `2109`)

---

© 2026 Linkeo. Todos los derechos reservados.
