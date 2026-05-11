<x-mail::message>
# ¡Bienvenido a Licora SaaS!

Hola,

Tu nueva licorería **{{ $tenantName }}** ha sido creada exitosamente y ya está lista para operar en nuestra plataforma. 

A continuación encontrarás tus credenciales de acceso. Por seguridad, el sistema te pedirá cambiar tu contraseña temporal la primera vez que ingreses.

<x-mail::panel>
**Enlace de Acceso:** [http://{{ $domain }}:5173](http://{{ $domain }}:5173)  
**Usuario:** {{ $email }}  
**Contraseña Temporal:** `{{ $password }}`
</x-mail::panel>

<x-mail::button :url="'http://'.$domain.':5173'" color="success">
Ingresar al Sistema
</x-mail::button>

Gracias por confiar en Licora para llevar tu negocio al siguiente nivel.<br>
Atentamente,<br>
**El equipo de {{ config('app.name') }}**
</x-mail::message>
