<x-mail::message>
# Hola {{ $name }},

Hemos recibido una solicitud para restablecer tu contraseña en la plataforma Licora.

Para tu seguridad, hemos generado una nueva contraseña temporal. Te recomendamos cambiarla inmediatamente después de iniciar sesión desde tu perfil.

<x-mail::panel>
**Tu nueva contraseña temporal es:** `{{ $newPassword }}`
</x-mail::panel>

<x-mail::button :url="config('app.url')">
Iniciar Sesión
</x-mail::button>

Si no solicitaste este cambio, por favor contacta al administrador del sistema.

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
