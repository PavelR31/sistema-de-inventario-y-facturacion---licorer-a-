# Licora - Sistema de Gestión para Licorerías (SaaS)

Licora es un proyecto de tipo Software as a Service (SaaS) diseñado para la implementación de licorerías multi-sucursal bajo una arquitectura multi-inquilino (multi-tenant). La plataforma permite el despliegue de múltiples negocios individuales sobre una misma infraestructura, asegurando que cada uno cuente con su propia base de datos aislada, gestión de usuarios, reportes financieros, inventario y configuración propia.

## Arquitectura y Propósito

El sistema está optimizado para empresas que requieren administrar diversos locales de forma centralizada o para proveedores de software que deseen ofrecer una solución de gestión a múltiples licorerías de forma independiente.

### Componentes principales:
*   **Aislamiento por Tenant**: Cada negocio registrado opera en su propia base de datos.
*   **Gestión Multi-sucursal**: Cada tenant puede administrar múltiples puntos de venta físicos.
*   **Módulos Integrados**: Inventario, Compras, POS (Punto de Venta), Facturación y Reportes avanzados.

## Stack Técnico

### Backend (API)
*   Laravel 11
*   Stancl/Tenancy (Arquitectura Multi-tenant)
*   MySQL (Base de Datos)
*   Laravel Sanctum (Autenticación API)

### Frontend (Web)
*   React + Vite
*   Tailwind CSS + Shadcn UI
*   Zustand (Gestión de estado)
*   Axios (Comunicación API)

---
© 2026 Licora. 