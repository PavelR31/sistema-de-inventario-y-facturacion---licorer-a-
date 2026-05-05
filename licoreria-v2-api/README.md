# Licora API - Backend Multi-tenant

El backend de Licora está construido con Laravel 11 y utiliza una arquitectura de base de datos dinámica para soportar múltiples inquilinos (tenants). Cada tenant posee su propio esquema de base de datos, lo que garantiza el aislamiento total de la información sensible entre diferentes negocios.

## Arquitectura Multi-tenant

El sistema utiliza el paquete `stancl/tenancy` para gestionar el ciclo de vida de los inquilinos. 

*   **Base de Datos Central**: Almacena la información de los tenants (dominios, identificadores) y los usuarios de nivel SuperAdmin.
*   **Bases de Datos de Tenant**: Se crean dinámicamente al registrar un nuevo negocio. Contienen las tablas de productos, ventas, clientes, sucursales y usuarios específicos del negocio.

## Requisitos
*   PHP 8.2+
*   Composer
*   MySQL 8.0+

## Instalación y Despliegue

1.  **Instalar dependencias**:
    ```bash
    composer install
    ```

2.  **Configurar entorno**:
    ```bash
    cp .env.example .env
    ```

3.  **Migrar Base de Datos Central**:
    ```bash
    php artisan migrate
    ```

4.  **Crear Usuario SuperAdmin**:
    Para poder acceder al panel central y crear licorerías, es necesario ejecutar el seeder de SuperAdmin:
    ```bash
    php artisan db:seed --class=SuperAdminSeeder
    ```

5.  **Configuración de Dominios**:
    Asegúrate de que tu servidor soporte subdominios dinámicos o configura los dominios necesarios en tu archivo `hosts` para desarrollo local (ej. `licora.test`, `tienda1.licora.test`).

## Comandos Críticos

*   **Actualizar esquemas de todos los inquilinos**:
    ```bash
    php artisan tenants:migrate
    ```
*   **Ejecutar lógica en un inquilino específico**:
    ```bash
    php artisan tenants:run <comando> --tenants=<id_tenant>
    ```

## Seguridad y Autenticación
El sistema utiliza **Laravel Sanctum** para la emisión de tokens. La autenticación se valida contra la base de datos correspondiente (central para administradores del SaaS, o la base de datos del tenant para empleados de la licorería) según el dominio desde el que se realiza la petición.
