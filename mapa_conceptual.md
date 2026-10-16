# Mapa Conceptual: Control de Vitrina Odoo

## Propósito
Aplicación web diseñada para conectarse a Odoo mediante API (JSON-RPC) y verificar qué productos están exhibidos en la ubicación "Vitrina", garantizando que ningún producto se quede sin exhibición.

## Arquitectura
- **Frontend:** React + Vite + TypeScript.
- **Estilos:** Vanilla CSS (Glassmorphism, Dark mode, Variables CSS).
- **Íconos:** Lucide-React.
- **Conexión a Odoo:** Centralizada en `src/OdooAPI.ts` usando Axios para peticiones JSON-RPC (actualmente usando datos mock para desarrollo visual).

## Componentes Principales
- **`App.tsx`:** Dashboard principal con:
  - Tarjetas de estadísticas (Total, Exhibidos, Peligro Luz >60d, Faltantes).
  - Filtros de estado (Todos, Exhibidos, Sin Exhibición), marca, categoría, vendedor, ESL y permanencia/rotación.
  - Barra de búsqueda por nombre o SKU.
  - Tabla de resultados con indicadores visuales de estado y semáforo de permanencia.
- **`OdooAPI.ts`:** Consulta en tiempo real a Odoo de `product.product` y `stock.quant` (con `create_date` y números de serie `lot_id`).
- **`index.css`:** Sistema de diseño visual moderno con badges semafóricos de permanencia.

## Características Destacadas
- **Valoración de Inventario:** Cálculo del valor total almacenado por producto (`stock * precio de lista`).
- **Control de Permanencia y Prevención de Decoloración (Días en Vitrina):**
  - Cálculo de días exactos que cada producto lleva exhibido bajo la luz de la vitrina.
  - Columna ordenable de mayor a menor para detectar de inmediato los productos más antiguos que urgen ser rotados.
  - Semáforo visual: Verde (≤30 días), Amarillo (31-60 días), Rojo / Peligro (>60 días).
- **Trazabilidad de Seriales vs Productos Fungibles (Sin Serial):**
  - **Con Serial:** Rastreo automático por el número de serie (`stock.production.lot`) y su fecha de ingreso a vitrina.
  - **Sin Serial:** Botón de acción rápida `[🔄 Rotar Caja]` que resetea el contador a 0 días y registra la fecha de rotación manual persistida en `localStorage`.
- **Zonas Calientes (Hot Zones):** Identifica el top 20% de productos de mayor valoración para darles prioridad visual (ej. nivel de ojos) usando indicador de llama (🔥).
- **Asignación de Reposición:** Distribuye equitativamente entre los vendedores la carga de reponer huecos en vitrina.
- **Exportación de Reportes:** Descarga en CSV el consolidado con valoración, días en vitrina, fecha de ingreso y tipo de control.

## Próximos Pasos (To-Do)
- Desplegar la aplicación en Coolify con proxy Odoo integrado.
- Posibilidad de sincronizar las rotaciones manuales como transferencias internas automáticas en Odoo vía API.

