# Licora Web - Frontend (React)

La interfaz de usuario de Licora es una Single Page Application (SPA) moderna desarrollada con React y Vite, diseñada para consumir la API multi-tenant de forma eficiente y segura.

## Sistema de Autenticación

La aplicación utiliza un sistema basado en **Tokens (Bearer)** gestionado a través de **Laravel Sanctum**.

*   **Persistencia**: Los tokens se almacenan de forma segura y se gestionan mediante un Store de **Zustand**.
*   **Interceptores Axios**: Se utiliza una instancia configurada de Axios que adjunta automáticamente el token de autenticación en las cabeceras de cada petición y maneja las respuestas de error (como tokens expirados) de forma centralizada.

## Gestión de Permisos (RBAC)

El sistema implementa un Control de Acceso Basado en Roles (RBAC) granular:

*   **Sincronización con API**: Los permisos del usuario se cargan en el momento del login y se validan en tiempo real en el frontend.
*   **Componente <Can />**: Se utiliza un componente de envoltura personalizado para proteger elementos de la interfaz, asegurando que los usuarios solo vean y operen sobre módulos para los que tienen autorización explícita.
*   **Protección de Rutas**: Las rutas de la aplicación están protegidas por Middlewares de React que validan tanto la sesión activa como los privilegios necesarios para acceder a secciones administrativas.

## Instalación

1.  **Instalar paquetes**:
    ```bash
    npm install
    ```

2.  **Configuración de API**:
    Define la URL de tu API en el archivo `.env`:
    ```env
    VITE_API_URL=http://tu-dominio-api.com
    ```

3.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```

## Stack Técnico Principal
*   **React + Vite**: Motor de la aplicación.
*   **Shadcn UI**: Sistema de componentes basado en Radix UI.
*   **Tailwind CSS**: Framework de estilos.
*   **Zustand**: Gestión de estado global ligera y rápida.
*   **React Query**: Sincronización de datos con el servidor y gestión de caché.
