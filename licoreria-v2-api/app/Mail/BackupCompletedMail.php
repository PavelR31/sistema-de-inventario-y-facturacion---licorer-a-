<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BackupCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenantName;
    public $filename;
    public $size;
    public $date;

    /**
     * Create a new message instance.
     */
    public function __construct($tenantName, $filename, $size)
    {
        $this->tenantName = $tenantName;
        $this->filename = $filename;
        $this->size = $size;
        $this->date = now()->format('d/m/Y H:i');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Respaldo de Base de Datos Completado - ' . $this->tenantName,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.backups.completed',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
