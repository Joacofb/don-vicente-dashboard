import { FinancialRecord } from '../types';
import { formatDateISO } from '../utils/dateUtils';

/**
 * Genera registros de ejemplo calculados en torno a la fecha de hoy
 */
export function getInitialDemoRecords(): FinancialRecord[] {
  const now = new Date();
  
  const getDateOffset = (daysAgo: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return formatDateISO(d);
  };

  return [
    // Hoy (Día actual)
    {
      id: 'rec-1',
      type: 'sale',
      date: getDateOffset(0),
      amount: 450.00,
      category: 'Ventas en Mostrador',
      description: 'Ventas del turno mañana',
      paymentMethod: 'cash',
      entityName: 'Clientes varios',
      notes: 'Mayor afluencia de clientes',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      createdBy: 'user-op1',
      createdByName: 'Operador 1 (Caja)',
    },
    {
      id: 'rec-2',
      type: 'sale',
      date: getDateOffset(0),
      amount: 1200.00,
      category: 'Cobro de Factura',
      description: 'Servicio mensual corporativo',
      paymentMethod: 'transfer',
      entityName: 'Empresa Alfa S.A.',
      notes: 'Factura #00124',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdBy: 'user-admin',
      createdByName: 'Joaquín (Administrador)',
    },
    {
      id: 'rec-3',
      type: 'expense',
      date: getDateOffset(0),
      amount: 180.00,
      category: 'Materia Prima / Mercadería',
      description: 'Reposición insumos diarios',
      paymentMethod: 'card',
      entityName: 'Distribuidora Central',
      notes: 'Pago con tarjeta corporativa',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      createdBy: 'user-op2',
      createdByName: 'Operador 2 (Auxiliar)',
    },
    // Ayer
    {
      id: 'rec-4',
      type: 'sale',
      date: getDateOffset(1),
      amount: 890.50,
      category: 'Venta de Productos',
      description: 'Venta online catálogo',
      paymentMethod: 'card',
      entityName: 'Tienda Digital',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      createdBy: 'user-op1',
      createdByName: 'Operador 1 (Caja)',
    },
    {
      id: 'rec-5',
      type: 'expense',
      date: getDateOffset(1),
      amount: 120.00,
      category: 'Transporte / Logística',
      description: 'Envíos a domicilio y flete',
      paymentMethod: 'transfer',
      entityName: 'Mensajería Express',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      createdBy: 'user-op2',
      createdByName: 'Operador 2 (Auxiliar)',
    },
    // Hace 2 días
    {
      id: 'rec-6',
      type: 'sale',
      date: getDateOffset(2),
      amount: 720.00,
      category: 'Servicios Prestados',
      description: 'Consultoría y asistencia técnica',
      paymentMethod: 'transfer',
      entityName: 'Consultora Sigma',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
    },
    {
      id: 'rec-7',
      type: 'expense',
      date: getDateOffset(2),
      amount: 350.00,
      category: 'Servicios Básicos (Luz/Agua/Internet)',
      description: 'Factura de luz e internet alta velocidad',
      paymentMethod: 'transfer',
      entityName: 'Compañía Eléctrica',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    // Hace 3 días
    {
      id: 'rec-8',
      type: 'sale',
      date: getDateOffset(3),
      amount: 630.00,
      category: 'Ventas en Mostrador',
      description: 'Ventas turno tarde',
      paymentMethod: 'cash',
      entityName: 'Clientes locales',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 74).toISOString()
    },
    {
      id: 'rec-9',
      type: 'expense',
      date: getDateOffset(3),
      amount: 85.00,
      category: 'Gastos Menores / Varios',
      description: 'Artículos de limpieza y cafetería',
      paymentMethod: 'cash',
      entityName: 'Supermercado Sol',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    },
    // Hace 4 días
    {
      id: 'rec-10',
      type: 'sale',
      date: getDateOffset(4),
      amount: 980.00,
      category: 'Venta de Productos',
      description: 'Pedido mayorista lote 12',
      paymentMethod: 'transfer',
      entityName: 'Comercializadora Norte',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 98).toISOString()
    },
    // Hace 7 días (Semana anterior)
    {
      id: 'rec-11',
      type: 'sale',
      date: getDateOffset(7),
      amount: 1450.00,
      category: 'Venta de Productos',
      description: 'Cierre semanal de pedidos',
      paymentMethod: 'transfer',
      entityName: 'Varios clientes',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 170).toISOString()
    },
    {
      id: 'rec-12',
      type: 'expense',
      date: getDateOffset(7),
      amount: 600.00,
      category: 'Alquiler de Local',
      description: 'Cuota quincenal oficina/local',
      paymentMethod: 'transfer',
      entityName: 'Inmobiliaria Horizonte',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString()
    },
    // Hace 8 días
    {
      id: 'rec-13',
      type: 'sale',
      date: getDateOffset(8),
      amount: 820.00,
      category: 'Servicios Prestados',
      description: 'Mantenimiento mensual de sistemas',
      paymentMethod: 'card',
      entityName: 'Tech Group',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 192).toISOString()
    },
    {
      id: 'rec-14',
      type: 'expense',
      date: getDateOffset(8),
      amount: 210.00,
      category: 'Marketing y Publicidad',
      description: 'Campaña en redes sociales',
      paymentMethod: 'card',
      entityName: 'Anuncios Digitales',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 190).toISOString()
    },
    // Hace 9 días
    {
      id: 'rec-15',
      type: 'sale',
      date: getDateOffset(9),
      amount: 510.00,
      category: 'Ventas en Mostrador',
      description: 'Caja diaria',
      paymentMethod: 'cash',
      entityName: 'Clientes al paso',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 216).toISOString()
    },
    {
      id: 'rec-16',
      type: 'expense',
      date: getDateOffset(9),
      amount: 320.00,
      category: 'Materia Prima / Mercadería',
      description: 'Compra de stock base',
      paymentMethod: 'transfer',
      entityName: 'Mayorista Andino',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 214).toISOString()
    }
  ];
}
