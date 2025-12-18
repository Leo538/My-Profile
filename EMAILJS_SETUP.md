# Configuración de EmailJS para el Formulario de Contacto

Para que los correos lleguen a tu Gmail (lozadaleonel15@gmail.com), necesitas configurar EmailJS.

## Pasos para Configurar EmailJS:

### 1. Crear cuenta en EmailJS
- Ve a https://www.emailjs.com/
- Crea una cuenta gratuita (permite hasta 200 emails/mes gratis)

### 2. Crear un Servicio de Email
- En el dashboard, ve a "Email Services"
- Haz clic en "Add New Service"
- Selecciona "Gmail" (o el proveedor que prefieras)
- Conecta tu cuenta de Gmail
- Guarda el **Service ID** que se genera

### 3. Crear una Plantilla de Email
- Ve a "Email Templates"
- Haz clic en "Create New Template"
- Usa esta plantilla:

```
Subject: Contacto desde Portfolio - {{from_name}}

De: {{from_name}}
Email: {{from_email}}

Mensaje:
{{message}}

---
Este mensaje fue enviado desde el formulario de contacto del portfolio.
```

- Guarda el **Template ID** que se genera

### 4. Obtener tu Public Key
- Ve a "Account" > "General"
- Copia tu **Public Key**

### 5. Configurar en el código
- Abre el archivo: `src/app/core/services/email.service.ts`
- Reemplaza estos valores:
  - `YOUR_PUBLIC_KEY` → Tu Public Key
  - `YOUR_SERVICE_ID` → Tu Service ID
  - `YOUR_TEMPLATE_ID` → Tu Template ID

### 6. Configurar el email de destino
- En la plantilla de EmailJS, asegúrate de que el campo "To Email" sea: `lozadaleonel15@gmail.com`
- O puedes usar el campo `to_email` en los parámetros de la plantilla

## Ejemplo de configuración final:

```typescript
const EMAILJS_CONFIG = {
  publicKey: 'abc123xyz', // Tu Public Key
  serviceId: 'service_abc123', // Tu Service ID
  templateId: 'template_xyz789', // Tu Template ID
  recipientEmail: 'lozadaleonel15@gmail.com',
};
```

## Nota Importante:
- El servicio gratuito de EmailJS permite 200 emails/mes
- Los correos llegarán directamente a tu Gmail
- No necesitas un servidor backend


