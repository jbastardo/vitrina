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
  - Tarjetas de estadísticas (Total, Exhibidos, Faltantes).
  - Filtros de estado (Todos, Exhibidos, Sin Exhibición).
  - Barra de búsqueda por nombre o SKU.
  - Tabla de resultados con indicadores visuales de estado.
- **`OdooAPI.ts`:** Clase encargada de la comunicación con el backend de Odoo.
- **`index.css`:** Sistema de diseño visual moderno.

## Características Destacadas
- **Valoración de Inventario:** Cálculo del valor total almacenado por producto (`stock * precio de lista`).
- **Zonas Calientes (Hot Zones):** Aplicación de mejores prácticas de vitrinismo que identifica el top 20% de productos de mayor valoración para darles prioridad visual (ej. ubicación a nivel de los ojos) usando un indicador de llama (🔥).
- **Asignación de Reposición:** Sistema que distribuye equitativamente entre los vendedores la carga de llenar los huecos detectados en la vitrina.
- **Exportación de Reportes:** Permite descargar a CSV todo el consolidado actualizando el análisis de valoración.

## Próximos Pasos (To-Do)
- Configurar credenciales reales de Odoo en `OdooAPI.ts`.
- Desplegar la aplicación (ej. en Coolify o Vercel).
- Asegurar configuración de CORS en el servidor Odoo para permitir peticiones desde el frontend.
