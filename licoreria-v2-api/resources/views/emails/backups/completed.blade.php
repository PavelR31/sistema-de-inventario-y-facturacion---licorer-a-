<x-mail::message>
# Respaldo Completado Exitosamente

Hola, te informamos que se ha generado un nuevo respaldo de seguridad de tu licorería **{{ $tenantName }}**.

<x-mail::table>
| Detalle | Información |
| :--- | :--- |
| **Archivo** | {{ $filename }} |
| **Tamaño** | {{ $size }} |
| **Fecha/Hora** | {{ $date }} |
</x-mail::table>

Los respaldos se almacenan de forma segura en nuestros servidores centrales. Puedes gestionarlos y descargarlos desde el panel de administración.

Gracias por confiar en nuestra seguridad,<br>
El equipo de {{ config('app.name') }}
</x-mail::message>
