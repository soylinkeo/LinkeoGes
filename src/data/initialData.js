// Datos maestros iniciales de LinkeoGes
// Extraídos directamente de Control de Gastos NFC.xlsx, linkeocards.com y los flyers oficiales
import { localDate } from '../utils/dateUtils.js';

export const PARTNERS = {
  luis: {
    id: 'luis',
    name: 'Luis Romero',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    email: 'luis@linkeocards.com',
    avatar: '👨‍💼',
    status: 'Disponible'
  },
  kevin: {
    id: 'kevin',
    name: 'Kevin Servat',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    email: 'kevin@linkeocards.com',
    avatar: '🚀',
    status: 'Disponible'
  }
};

export const INITIAL_EXPENSES = [];
export const INITIAL_SALES = [];
export const INITIAL_NFC_CARDS = [];
export const INITIAL_LEADS = [];

export const INITIAL_INVENTORY = [
  {
    id: 'inv-1',
    sku: 'SKU-LNK-1367',
    name: 'Tarjeta Google NFC Cuadrado ING',
    category: 'CHIPS / INSUMOS',
    quantity: 1,
    minThreshold: 10,
    unitCost: 12.93,
    supplier: 'HACHANI_UN Official Store',
    leadTimeDays: 13,
    status: 'bajo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo de tarjeta cuadrada con chip NTAG215 versión inglés.'
  },
  {
    id: 'inv-2',
    sku: 'SKU-LNK-6781',
    name: 'Tarjeta Google NFC Cuadrado ESP',
    category: 'CHIPS / INSUMOS',
    quantity: 15,
    minThreshold: 5,
    unitCost: 12.93,
    supplier: 'NFC Marketing',
    leadTimeDays: 13,
    status: 'optimo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo de tarjeta cuadrada con chip NTAG215 versión español. Lote inicial fabricado (15 uds).'
  },
  {
    id: 'inv-3',
    sku: 'SKU-LNK-9972',
    name: 'Tarjeta Google NFC L ESP',
    category: 'CHIPS / INSUMOS',
    quantity: 15,
    minThreshold: 5,
    unitCost: 12.93,
    supplier: 'NFC Marketing',
    leadTimeDays: 13,
    status: 'optimo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo formato vertical L para mostrador y mesa con chip NTAG215. Lote inicial fabricado (15 uds).'
  },
  {
    id: 'inv-carnet',
    sku: 'SKU-LNK-4951',
    name: 'Tarjeta Google NFC Carnet ESP',
    category: 'CHIPS / INSUMOS',
    quantity: 10,
    minThreshold: 5,
    unitCost: 12.93,
    supplier: 'HACHANI_UN Official Store',
    leadTimeDays: 13,
    status: 'optimo',
    reorderUrl: 'https://es.aliexpress.com/',
    notes: 'Insumo tarjeta vertical formato carnet portátil con chip NTAG215.'
  },
  {
    id: 'inv-4',
    sku: 'SKU-LNK-BASE',
    name: 'Base Acrílica Display de Mesa',
    category: 'DISPLAY / SOPORTE',
    quantity: 15,
    minThreshold: 5,
    unitCost: 10.00,
    supplier: 'Acrílicos Lima Centro',
    leadTimeDays: 2,
    status: 'optimo',
    reorderUrl: '',
    notes: 'Soporte transparente para exhibición de tarjetas en barras y recepción.'
  },
  {
    id: 'inv-5',
    sku: 'SKU-LNK-PKGK',
    name: 'Kit de Packaging & Sobres Premium',
    category: 'PACKAGING / EMPAQUE',
    quantity: 40,
    minThreshold: 10,
    unitCost: 3.00,
    supplier: 'Empaques Express Lima',
    leadTimeDays: 1,
    status: 'optimo',
    reorderUrl: '',
    notes: 'Sobre negro mate con sticker holográfico oficial Linkeo.'
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-ind-1',
    inventoryId: 'inv-2',
    name: 'Tarjeta Google NFC Cuadrado ESP',
    sku: 'SKU-LNK-6781',
    category: 'Individual',
    type: 'individual',
    price: 60.00,
    cost: 12.93,
    margin: 47.07,
    marginPct: 78.45,
    badge: 'Popular',
    description: 'Tarjeta inteligente horizontal con chip NTAG215 para reseñas de Google en español. Diseñada para mostrador y barras de restaurantes.',
    bundleItems: []
  },
  {
    id: 'prod-ind-2',
    inventoryId: 'inv-3',
    name: 'Tarjeta Google NFC Formato L ESP',
    sku: 'SKU-LNK-9972',
    category: 'Individual',
    type: 'individual',
    price: 80.00,
    cost: 12.93,
    margin: 67.07,
    marginPct: 83.84,
    badge: 'Premium',
    description: 'Display vertical en ángulo L de alto impacto visual para caja y recepción con reseña directa de Google Maps.',
    bundleItems: []
  },
  {
    id: 'prod-ind-3',
    inventoryId: 'inv-1',
    name: 'Tarjeta Google NFC Cuadrado ING',
    sku: 'SKU-LNK-1367',
    category: 'Individual',
    type: 'individual',
    price: 60.00,
    cost: 12.93,
    margin: 47.07,
    marginPct: 78.45,
    badge: 'Inglés',
    description: 'Tarjeta inteligente con chip NTAG215 para reseñas de Google versión en inglés para hoteles y turismo.',
    bundleItems: []
  },
  {
    id: 'prod-ind-4',
    inventoryId: 'inv-carnet',
    name: 'Tarjeta Google NFC Carnet ESP',
    sku: 'SKU-LNK-4951',
    category: 'Individual',
    type: 'individual',
    price: 40.00,
    cost: 12.93,
    margin: 27.07,
    marginPct: 67.68,
    badge: 'Portátil',
    description: 'Tarjeta vertical formato carnet portátil, práctica y elegante para llevar la conexión consigo.',
    bundleItems: []
  },
  {
    id: 'prod-pack-1',
    name: 'Pack Restaurante Dúo (2 Tarjetas NFC)',
    sku: 'SKU-PACK-DUO',
    category: 'Pack',
    type: 'pack',
    price: 100.00,
    cost: 25.86,
    regularPrice: 120.00,
    margin: 74.14,
    marginPct: 74.14,
    badge: 'Ahorro S/ 20',
    description: 'Promoción especial para locales con dos puntos de contacto (Caja + Barra). Incluye 2 tarjetas inteligentes configuradas.',
    bundleItems: [
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 2, unitCost: 12.93 }
    ]
  },
  {
    id: 'prod-pack-2',
    name: 'Combo Corporativo Trío (3 Tarjetas + Display)',
    sku: 'SKU-PACK-TRIO',
    category: 'Pack',
    type: 'pack',
    price: 160.00,
    cost: 38.79,
    regularPrice: 200.00,
    margin: 121.21,
    marginPct: 75.76,
    badge: 'Más Vendido',
    description: 'Combo empresarial: 2 Tarjetas Cuadradas + 1 Tarjeta Formato L + 1 Base acrílica para locales gastronómicos o retail.',
    bundleItems: [
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 2, unitCost: 12.93 },
      { id: 'inv-3', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC L ESP', quantity: 1, unitCost: 12.93 }
    ]
  },
  {
    id: 'prod-pack-emprendedor',
    name: 'Pack Emprendedor (Horizontal + Vertical)',
    sku: 'SKU-PACK-EMPRENDEDOR',
    category: 'Pack',
    type: 'pack',
    price: 80.00,
    cost: 25.86,
    regularPrice: 100.00,
    margin: 54.14,
    marginPct: 67.68,
    badge: '🔥 Oferta Web',
    description: 'Pack Emprendedor oficial de la web: 1 Tarjeta Horizontal (PVP S/ 60) + 1 Tarjeta Vertical (PVP S/ 40). Precio regular S/ 100.',
    bundleItems: [
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 1, unitCost: 12.93 },
      { id: 'inv-carnet', sku: 'SKU-LNK-4951', name: 'Tarjeta Google NFC Carnet ESP', quantity: 1, unitCost: 12.93 }
    ]
  },
  {
    id: 'prod-pack-negocio',
    name: 'Pack Negocio (Display de Mesa + Vertical)',
    sku: 'SKU-PACK-NEGOCIO',
    category: 'Pack',
    type: 'pack',
    price: 100.00,
    cost: 25.86,
    regularPrice: 120.00,
    margin: 74.14,
    marginPct: 74.14,
    badge: 'Mostrador + Tarjeta',
    description: 'Display de Mesa (PVP S/ 80) + Tarjeta Vertical (PVP S/ 40). Precio regular por separado S/ 120.',
    bundleItems: [
      { id: 'inv-3', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC L ESP', quantity: 1, unitCost: 12.93 },
      { id: 'inv-carnet', sku: 'SKU-LNK-4951', name: 'Tarjeta Google NFC Carnet ESP', quantity: 1, unitCost: 12.93 }
    ]
  },
  {
    id: 'prod-pack-duo-premium',
    name: 'Pack Dúo Premium (Display de Mesa + Horizontal)',
    sku: 'SKU-PACK-DUO-PREMIUM',
    category: 'Pack',
    type: 'pack',
    price: 120.00,
    cost: 25.86,
    regularPrice: 140.00,
    margin: 94.14,
    marginPct: 78.45,
    badge: 'Mayor Presencia',
    description: 'Display de Mesa (PVP S/ 80) + Tarjeta Horizontal (PVP S/ 60). Precio regular por separado S/ 140.',
    bundleItems: [
      { id: 'inv-3', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC L ESP', quantity: 1, unitCost: 12.93 },
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 1, unitCost: 12.93 }
    ]
  },
  {
    id: 'prod-pack-full',
    name: 'Pack Full (Display de Mesa + Horizontal + Vertical)',
    sku: 'SKU-PACK-FULL',
    category: 'Pack',
    type: 'pack',
    price: 150.00,
    cost: 38.79,
    regularPrice: 180.00,
    margin: 111.21,
    marginPct: 74.14,
    badge: '👑 Los 3 Modelos',
    description: 'Los tres modelos en un solo pack: Display de Mesa + Tarjeta Horizontal + Tarjeta Vertical. Precio regular S/ 180.',
    bundleItems: [
      { id: 'inv-3', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC L ESP', quantity: 1, unitCost: 12.93 },
      { id: 'inv-2', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 1, unitCost: 12.93 },
      { id: 'inv-carnet', sku: 'SKU-LNK-4951', name: 'Tarjeta Google NFC Carnet ESP', quantity: 1, unitCost: 12.93 }
    ]
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'supp-1',
    name: 'HACHANI_UN Official Store',
    category: 'Importador AliExpress (China)',
    contactPerson: 'AliExpress Direct',
    phone: '+86 138 0000 0000',
    email: 'support@aliexpress.com',
    country: 'China',
    leadTimeDays: 13,
    minOrderQty: 10,
    status: 'Activo',
    paymentTerms: 'Tarjeta de Crédito / PayPal',
    notes: 'Chips NTAG215 vírgenes y acrílicos grabados por lote.'
  },
  {
    id: 'supp-2',
    name: 'NFC Marketing',
    category: 'Distribuidor Especializado NFC',
    contactPerson: 'Ventas Lima',
    phone: '+51 987 654 321',
    email: 'ventas@nfcmarketing.pe',
    country: 'Perú',
    leadTimeDays: 2,
    minOrderQty: 5,
    status: 'Activo',
    paymentTerms: 'Transferencia BCP / Yape',
    notes: 'Insumos de entrega rápida local en Lima.'
  },
  {
    id: 'supp-3',
    name: 'Acrílicos Lima Centro',
    category: 'Fabricante de Bases y Displays',
    contactPerson: 'Taller San Juan',
    phone: '+51 999 111 222',
    email: 'pedidos@acrilicoslima.pe',
    country: 'Perú',
    leadTimeDays: 2,
    minOrderQty: 10,
    status: 'Activo',
    paymentTerms: 'Contado 50% adelanto',
    notes: 'Corte láser y doblado en caliente de acrílico cristal 3mm.'
  }
];

// Plan de 30 días declarado obsoleto por el equipo operativo en favor de la Rutina de 4 Bloques en Agenda
export const EXCEL_PLAN_30_DAYS_TEMPLATE = [];
export const INITIAL_PLAN_30_DAYS = [];

// Protocolo Operativo Diario de 4 Bloques (Estratégico & Personalizable)
export const DEFAULT_PROTOCOL_BLOCKS = [
  {
    id: 'bloque-1',
    blockNumber: 1,
    title: 'Bloque 1: CRM & Backoffice',
    schedule: '15:00 - 16:00',
    description: 'Asegurar el dinero en mesa: 8 prospectos en Respuestas + cierre al lead caliente en Negociación (Maps gratis).',
    themeColor: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    startTime: '15:00',
    endTime: '16:00'
  },
  {
    id: 'bloque-2',
    blockNumber: 2,
    title: 'Bloque 2: Creación Contenido',
    schedule: '16:00 - 17:00',
    description: '3-4 videos POV mostrando lectura rápida con las 3 tarjetas en stock + 1 video diario TikTok/Reels con CTA al perfil.',
    themeColor: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    bgColor: 'rgba(168, 85, 247, 0.08)',
    startTime: '16:00',
    endTime: '17:00'
  },
  {
    id: 'bloque-3',
    blockNumber: 3,
    title: 'Bloque 3: Campo & Preventas',
    schedule: '17:00 - 18:30',
    description: 'Ruta Este/Centro (Mar/Jue) y Corredores (Lun/Mié/Vie). Tap & Wow en vivo + preventa 50% de anticipo por QR.',
    themeColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    startTime: '17:00',
    endTime: '18:30'
  },
  {
    id: 'bloque-4',
    blockNumber: 4,
    title: 'Bloque 4: Inversión Flujo (S/ 160)',
    schedule: 'Inversión & Ads',
    description: 'Packaging Kraft (S/ 40) + Meta Ads S/ 10/día por 12 días (S/ 120) dirigidos a WhatsApp Business y web.',
    themeColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    startTime: '18:30',
    endTime: '20:30'
  }
];

// Rutina Operativa Estratégica Linkeo (Bloques 1 al 4) para la Agenda de Citas y Tareas
export const OPERATIONAL_ROUTINE_EVENTS = [
  // --- CITAS Y VISITAS PRESENCIALES (SALIDAS A CAMPO) ---
  {
    id: 'evt-bloque-3-corta',
    title: 'Salida a Campo: Ruta Diaria Lima Este/Centro (Ventana Corta)',
    type: 'route',
    partner: 'both',
    date: localDate(),
    startTime: '17:00',
    endTime: '18:30',
    client: 'Negocios locales cerca de ruta diaria',
    district: 'Lima Cercado',
    description: 'Martes y Jueves (17:00 - 18:30): Como las clases de titulación empiezan a las 7:00 PM, usar esta hora y media exclusivamente para visitar negocios locales cerca de tu ruta diaria (Lima Este/Centro). Llevar las tarjetas cuadradas restantes y aplicar el "Tap & Wow" en vivo. Si se venden las 3, cambiar inmediatamente a modo preventa (cobrando 50% de adelanto mediante QR para el lote de Temu).',
    status: 'pendiente',
    completed: false,
    resultSummary: '',
    isDailyTask: false
  },
  {
    id: 'evt-bloque-3-larga',
    title: 'Salida a Campo: Corredores Gastronómicos (Ventana Larga)',
    type: 'demo',
    partner: 'both',
    date: localDate(),
    startTime: '17:00',
    endTime: '20:30',
    client: 'Chifas, pollerías, restobares y cafeterías',
    district: 'Miraflores',
    description: 'Lunes, Miércoles y Viernes (Ventana Larga): Tarde/noche libre. Ir a corredores comerciales gastronómicos más grandes (chifas, pollerías, restobares) donde el flujo de clientes a esa hora es alto. Demostración en vivo "Tap & Wow", venta de stock restante y levantamiento de preventas con 50% de anticipo por QR.',
    status: 'pendiente',
    completed: false,
    resultSummary: '',
    isDailyTask: false
  },

  // --- TAREAS DIARIAS OPERATIVAS (POR BLOQUES ESTRATÉGICOS) ---
  {
    id: 'task-bloque-1-pipeline',
    title: 'Bloque 1 (15:00 - 15:30): Atacar Pipeline - Contactar 8 prospectos en "Respuestas"',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Ventas',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '15:00',
    endTime: '15:30',
    description: 'Antes de salir a la calle o grabar, hay que asegurar el dinero que ya está en la mesa. Abre LinkeoGes y contacta a esos 8 prospectos que están en fase de "Respuestas". El mensaje debe ser: "Hola [Nombre], nos acaban de quedar las últimas 2 tarjetas en stock esta semana. ¿Te reservo una o la separamos para el próximo lote?".'
  },
  {
    id: 'task-bloque-1-cierre',
    title: 'Bloque 1 (15:30 - 16:00): Cierre de Prospecto Caliente (1 Lead en "Negociación")',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Ventas',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '15:30',
    endTime: '16:00',
    description: 'Tienes 1 lead en "Negociación". A ese cliente ofrécele la creación gratuita de su ficha de Google Maps si cierra la compra hoy mismo con las tarjetas que te quedan en mano.'
  },
  {
    id: 'task-bloque-2-grabacion',
    title: 'Bloque 2 (16:00 - 16:30): Grabar 3-4 Videos POV con las 3 Tarjetas en Stock',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Contenido',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '16:00',
    endTime: '16:30',
    description: 'El contenido que mejor te funciona en TikTok es el formato POV (vista en primera persona) mostrando cómo el celular lee la tarjeta negra inmediatamente. Agarra las 3 tarjetas que te quedan y graba 3 o 4 videos cortos (10-15 segundos) con diferentes ángulos o en diferentes mesas antes de venderlas.'
  },
  {
    id: 'task-bloque-2-publicacion',
    title: 'Bloque 2 (16:30 - 17:00): Publicar en TikTok & Reel en Instagram (CTA linkeocards.com)',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Marketing',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '16:30',
    endTime: '17:00',
    description: 'Llamado a la acción (CTA): Al final de cada video, no digas "cómprame". Di: "Ve al link de nuestro perfil para elegir tu Linkeo" para dirigir el tráfico directo a linkeocards.com. Sube un video diario a TikTok y replícalo como Reel en Instagram.'
  },
  {
    id: 'task-bloque-3-preventas',
    title: 'Bloque 3 (17:00 - 18:30): Salida a Campo, "Tap & Wow" y Preventas 50% Adelanto',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Ventas',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '17:00',
    endTime: '18:30',
    description: 'Lleva las tarjetas cuadradas restantes y apliquen el "Tap & Wow" en vivo. Si venden las 3, cambien inmediatamente a modo preventa (cobrando 50% de adelanto mediante QR para el lote de reposición Temu).'
  },
  {
    id: 'task-bloque-4-logistica',
    title: 'Bloque 4: Logística y Packaging Corporativo Linkeo (Presupuesto S/ 40)',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Operaciones',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '10:00',
    endTime: '11:00',
    description: 'Con el flujo de caja actual, la publicidad y la percepción visual son la prioridad. Logística (S/ 40): Compra los sobres o cajas Kraft y manda a imprimir stickers con el logo de Linkeo. Las tarjetas del próximo lote no pueden entregarse sin empaque corporativo.'
  },
  {
    id: 'task-bloque-4-publicidad',
    title: 'Bloque 4: Inversión en Publicidad Digital Meta Ads (Presupuesto S/ 120)',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    category: 'Marketing',
    priority: 'alta',
    status: 'pendiente',
    completed: false,
    date: localDate(),
    startTime: '11:00',
    endTime: '12:00',
    description: 'Publicidad Digital (S/ 120): Invierte S/ 10 diarios durante 12 días en Facebook/Instagram Ads. Usa como anuncio el Reel donde acercas el celular a la tarjeta. Dirige ese tráfico hacia tu botón de WhatsApp Business o hacia el catálogo de precios en tu web.'
  }
];

export const INITIAL_CALENDAR_EVENTS = OPERATIONAL_ROUTINE_EVENTS;

export const FINANCIAL_TARGETS = {
  monthlyProfitTarget: 4000.00, // S/ 4,000 meta neta del negocio
  monthlyUnitsTarget: 75,       // 75 unidades
  targetPerPartner: 2012.50,    // S/ 2,012.50 por socio
  monthlyRevenueEstimate: 5100.00
};

export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_DISTRICTS = [
  'Miraflores',
  'San Isidro',
  'Santiago de Surco',
  'San Borja',
  'Barranco',
  'Magdalena del Mar',
  'Jesús María',
  'Lince',
  'San Miguel',
  'Pueblo Libre',
  'La Molina',
  'Surquillo',
  'Lima Cercado',
  'La Victoria',
  'Ate',
  'Breña',
  'Chorrillos',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Martín de Porres',
  'Los Olivos',
  'Independencia',
  'Comas',
  'Carabayllo',
  'Puente Piedra',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'Lurín',
  'Pachacámac',
  'Cieneguilla',
  'El Agustino',
  'Rímac',
  'Santa Anita',
  'San Luis',
  'Chaclacayo',
  'Lurigancho-Chosica',
  'Ancón',
  'Santa Rosa',
  'Punta Hermosa',
  'Punta Negra',
  'San Bartolo',
  'Santa María del Mar',
  'Pucusana',
  'Callao',
  'Bellavista',
  'La Perla',
  'La Punta',
  'Carmen de la Legua',
  'Ventanilla',
  'Mi Perú'
];

export const INITIAL_PROJECT_PHASES = [
  {
    id: 'fase-1',
    phaseNumber: 1,
    key: 'inicio',
    name: '1. Inicio & Definición de Negocio (Kickoff)',
    description: 'Establecimiento del modelo de negocio de tarjetas NFC para Google Reviews, reglas societarias y propuesta de valor.',
    progress: 100,
    status: 'completado',
    leader: 'both',
    deliverables: [
      { id: 'del-1-1', title: 'Definición de propuesta de valor: Tarjetas y displays inteligentes para reseñas Google 5 estrellas', completed: true, assignedTo: 'luis' },
      { id: 'del-1-2', title: 'Acuerdo societario 50/50: Desembolsos compartidos equitativamente y distribución neta igualitaria', completed: true, assignedTo: 'both' },
      { id: 'del-1-3', title: 'Identidad de marca y dominio linkeocards.com activo', completed: true, assignedTo: 'kevin' },
      { id: 'del-1-4', title: 'Acuerdo societario y liderazgo compartido: Luis Romero & Kevin Servat (Co-Fundadores & Co-CEOs al 50/50)', completed: true, assignedTo: 'both' }
    ]
  },
  {
    id: 'fase-2',
    phaseNumber: 2,
    key: 'planificacion',
    name: '2. Planificación Operativa & Financiera',
    description: 'Estructuración de costos, metas mensuales (S/ 5,100 / 75 uds), cadena de suministros y protocolos de agenda.',
    progress: 100,
    status: 'completado',
    leader: 'both',
    deliverables: [
      { id: 'del-2-1', title: 'Estructura oficial de precios: Displays S/ 60, Horizontal S/ 80, Vertical S/ 40 y Packs promocionales', completed: true, assignedTo: 'luis' },
      { id: 'del-2-2', title: 'Meta financiera: 75 unidades mensuales para alcanzar S/ 4,000 de utilidad neta libre', completed: true, assignedTo: 'both' },
      { id: 'del-2-3', title: 'Homologación de proveedores de chips NTAG215 (AliExpress) y acrílicos en Lima', completed: true, assignedTo: 'kevin' },
      { id: 'del-2-4', title: 'Protocolo de coordinación y cobertura operativa 50/50 entre Co-CEOs', completed: true, assignedTo: 'both' },
      { id: 'del-2-5', title: 'Checklist maestro de 30 días para ejecución comercial sistemática', completed: true, assignedTo: 'luis' }
    ]
  },
  {
    id: 'fase-3',
    phaseNumber: 3,
    key: 'implementacion',
    name: '3. Implementación Comercial & Técnica',
    description: 'Producción inicial, pruebas de lectura NFC en Android/iOS, pipeline B2B y despliegue del software LinkeoGes.',
    progress: 60,
    status: 'en_proceso',
    leader: 'kevin',
    deliverables: [
      { id: 'del-3-1', title: 'Validación técnica de payloads NDEF para enlace directo de reseñas Google', completed: true, assignedTo: 'kevin' },
      { id: 'del-3-2', title: 'Adquisición de primer lote de prueba (15 tarjetas NTAG215 vírgenes)', completed: true, assignedTo: 'kevin' },
      { id: 'del-3-3', title: 'Construcción y despliegue del ERP/CRM LinkeoGes para control integral', completed: true, assignedTo: 'luis' },
      { id: 'del-3-4', title: 'Rutas presenciales de prospección en distritos clave (Miraflores, San Isidro, Barranco)', completed: false, assignedTo: 'both' },
      { id: 'del-3-5', title: 'Kit de empaque premium con sobres y stickers corporativos Linkeo', completed: false, assignedTo: 'kevin' }
    ]
  },
  {
    id: 'fase-4',
    phaseNumber: 4,
    key: 'monitoreo',
    name: '4. Monitoreo, Control & Auditoría',
    description: 'Conciliación periódica de cuentas 50/50, seguimiento de stock crítico, registro de auditoría y feedback de clientes.',
    progress: 100,
    status: 'completado',
    leader: 'both',
    deliverables: [
      { id: 'del-4-1', title: 'Algoritmo de balance y liquidación automática 50/50 en tiempo real', completed: true, assignedTo: 'luis' },
      { id: 'del-4-2', title: 'Sistema de alertas por quiebre de stock (< 20 unidades) considerando 18 días de envío', completed: true, assignedTo: 'kevin' },
      { id: 'del-4-3', title: 'Bitácora universal de auditoría con registro de bajas, ediciones y creadores', completed: true, assignedTo: 'both' },
      { id: 'del-4-4', title: 'Métricas de conversión y velocidad de ciclo de ventas en Kanban', completed: true, assignedTo: 'luis' }
    ]
  },
  {
    id: 'fase-5',
    phaseNumber: 5,
    key: 'finalizacion',
    name: '5. Cierre de Fase & Escalamiento a Nuevas Líneas',
    description: 'Consolidación del modelo en Lima, cierre contable mensual y apertura de innovaciones (menús QR, vCard, Supabase).',
    progress: 20,
    status: 'en_proceso',
    leader: 'both',
    deliverables: [
      { id: 'del-5-1', title: 'Evaluación del primer mes de operación y distribución de utilidades', completed: false, assignedTo: 'both' },
      { id: 'del-5-2', title: 'Migración a base de datos persistente en nube (Supabase + Vercel con cuenta oficial Linkeo)', completed: true, assignedTo: 'both' },
      { id: 'del-5-3', title: 'Desarrollo de línea de Menús Digitales QR para restaurantes y cafeterías', completed: false, assignedTo: 'kevin' },
      { id: 'del-5-4', title: 'Desarrollo de línea de Tarjetas Personales Ejecutivas vCard NFC', completed: false, assignedTo: 'luis' },
      { id: 'del-5-5', title: 'Expansión de ventas a distritos de Lima Norte y provincias', completed: false, assignedTo: 'both' }
    ]
  }
];

// Plantillas de referencia extraídas de Control de Gastos NFC.xlsx
export const EXCEL_FIXED_COSTS_TEMPLATE = [
  { id: 'fc-1', concept: 'Publicidad (Ads Meta/TikTok)', amount: 0, note: 'Presupuesto de prueba digital' },
  { id: 'fc-2', concept: 'Movilidad para visitas presenciales', amount: 0, note: 'Prospección en distritos de Lima' },
  { id: 'fc-3', concept: 'Teléfono / Datos móviles', amount: 100, note: 'Parte atribuible al negocio' },
  { id: 'fc-4', concept: 'Dominio web / Sistemas', amount: 0, note: 'Equivalente mensual inicial' },
  { id: 'fc-5', concept: 'Material de muestra física', amount: 0, note: 'Se considera en inversión inicial' },
  { id: 'fc-6', concept: 'Otros imprevistos', amount: 0, note: 'Fondo de contingencia operativo' }
];

export const EXCEL_PROJECTED_PRODUCTS_TEMPLATE = [
  {
    id: 'proj-cuadrado-esp',
    name: 'Tarjeta Google NFC Cuadrado ESP',
    sku: 'SKU-LNK-6781',
    price: 60.00,
    baseCost: 12.93,
    mixPercent: 50,
    targetUnits: 15,
    isCustom: false,
    included: true
  },
  {
    id: 'proj-formato-l-esp',
    name: 'Tarjeta Google NFC Formato L ESP',
    sku: 'SKU-LNK-9972',
    price: 80.00,
    baseCost: 12.93,
    mixPercent: 50,
    targetUnits: 15,
    isCustom: false,
    included: true
  }
];

export const EXCEL_INITIAL_INVESTMENT_TEMPLATE = [
  { id: 'inv-1', concept: 'Inventario Estándar inicial', quantity: 25, unitCost: 13.00, total: 325.00 },
  { id: 'inv-2', concept: 'Inventario Premium inicial', quantity: 25, unitCost: 13.00, total: 325.00 },
  { id: 'inv-3', concept: 'Empaques y packaging', quantity: 50, unitCost: 2.00, total: 100.00 },
  { id: 'inv-4', concept: 'Unidades de muestra operativas', quantity: 2, unitCost: 13.00, total: 26.00 },
  { id: 'inv-5', concept: 'Dominio anual linkeocards.com', quantity: 1, unitCost: 110.00, total: 110.00 },
  { id: 'inv-6', concept: 'Publicidad de lanzamiento', quantity: 1, unitCost: 300.00, total: 300.00 },
  { id: 'inv-7', concept: 'Movilidad de prospección inicial', quantity: 1, unitCost: 200.00, total: 200.00 },
  { id: 'inv-8', concept: 'Fondo de imprevistos', quantity: 1, unitCost: 100.00, total: 100.00 }
];

// Plantilla oficial basada en el Stock Real Fabricado (30 tarjetas: 15 Cuadrado + 15 Formato L)
export const STOCK_FABRICADO_30_TEMPLATE = {
  businessParams: {
    salesDaysPerMonth: 30,
    partnersCount: 2,
    businessProfitTarget: 1662.10,
    partnerProfitTarget: 831.05,
    customProfitTarget: 1662.10
  },
  fixedCosts: [
    {
      id: 'fc-movilidad',
      concept: 'Movilidad mensual (visitas presenciales)',
      amount: 50.00,
      note: 'Prospección y entrega en distritos de Lima'
    }
  ],
  variableCosts: [],
  variableUnitCosts: {
    packagingPerUnit: 0.00,
    setupLaborPerUnit: 0.00,
    paymentFeePercent: 0.0,
    deliveryPerUnit: 0.00,
    defectReservePerUnit: 0.00
  },
  projectedProducts: [
    {
      id: 'proj-cuadrado-esp',
      name: 'Tarjeta Google NFC Cuadrado ESP',
      sku: 'SKU-LNK-6781',
      price: 60.00,
      baseCost: 12.93,
      mixPercent: 50,
      targetUnits: 15,
      isCustom: false,
      included: true
    },
    {
      id: 'proj-formato-l-esp',
      name: 'Tarjeta Google NFC Formato L ESP',
      sku: 'SKU-LNK-9972',
      price: 80.00,
      baseCost: 12.93,
      mixPercent: 50,
      targetUnits: 15,
      isCustom: false,
      included: true
    }
  ],
  initialInvestment: EXCEL_INITIAL_INVESTMENT_TEMPLATE,
  funnelRatios: {
    contactToResponse: 0.35,
    responseToDemo: 0.70,
    demoToCustomer: 0.40,
    unitsPerCustomer: 1.29,
    customUnits: 30
  }
};

export const DEFAULT_VARIABLE_COSTS_TEMPLATE = [
  { id: 'vc-packaging', concept: 'Empaque por Unidad', type: 'unit_amount', amount: 0, note: 'Bolsa Kraft, estuche o caja protectora con sticker' },
  { id: 'vc-labor', concept: 'Mano de Obra / Configuración NDEF', type: 'unit_amount', amount: 0, note: 'Tiempo invertido en grabación y pruebas con smartphone' },
  { id: 'vc-gateway', concept: 'Comisión de Cobro (% Venta)', type: 'percentage', amount: 0, note: '0% si es Yape/Plin, ~4% si es POS tarjeta' },
  { id: 'vc-delivery', concept: 'Delivery Asumido por Linkeo', type: 'unit_amount', amount: 0, note: 'S/ 0 si el cliente recoge o asume el envío' },
  { id: 'vc-warranty', concept: 'Reserva por Defectos / Garantía', type: 'unit_amount', amount: 0, note: 'Fondo para reposición inmediata al cliente' }
];

// Configuración base de Proyecciones: Escenario Libre con valores limpios para registro manual
export const INITIAL_PROJECTIONS_DATA = {
  // Parámetros generales del negocio (Escenario Libre)
  businessParams: {
    salesDaysPerMonth: 24,       // Lunes a sábado aprox.
    partnersCount: 2,           // Luis Romero y Kevin Servat (50/50)
    businessProfitTarget: 0,
    partnerProfitTarget: 0,
    customProfitTarget: 0       // Valor inicial en 0 para escenario libre
  },

  // Gastos Fijos Mensuales (inicia vacío)
  fixedCosts: [],

  // Gastos y Costos Variables (inicia vacío para escenario libre)
  variableCosts: [],

  // Costos Variables Unitarios Adicionales (inicia en 0)
  variableUnitCosts: {
    packagingPerUnit: 0.00,
    setupLaborPerUnit: 0.00,
    paymentFeePercent: 0.0,
    deliveryPerUnit: 0.00,
    defectReservePerUnit: 0.00
  },

  // Productos Proyectados Iniciales (inicia vacío)
  projectedProducts: [],

  // Inversión Inicial (inicia vacío)
  initialInvestment: [],

  // Ratios de Conversión del Embudo de Ventas
  funnelRatios: {
    contactToResponse: 0.35,  // 35% responden al contacto inicial
    responseToDemo: 0.70,     // 70% de los que responden aceptan demo/video
    demoToCustomer: 0.40,     // 40% de demos se convierten en clientes compradores
    unitsPerCustomer: 1.29    // Promedio de unidades por cliente
  }
};

