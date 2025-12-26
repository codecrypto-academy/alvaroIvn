/**
 * Sistema de detección de intenciones para el asistente de IA
 * Detecta qué acción quiere realizar el usuario en el contrato
 */

export type Intent =
  | 'create_token'
  | 'transfer_token'
  | 'accept_transfer'
  | 'reject_transfer'
  | 'request_role'
  | 'approve_user'
  | 'reject_user'
  | 'view_tokens'
  | 'view_transfers'
  | 'view_balance'
  | 'help'
  | 'unknown';

export interface DetectedIntent {
  intent: Intent;
  confidence: number;
  entities: Record<string, any>;
  rawMessage: string;
}

// Patrones para cada intención
const intentPatterns: Record<Intent, RegExp[]> = {
  create_token: [
    /crear\s+(un\s+)?token/i,
    /nuevo\s+token/i,
    /generar\s+(un\s+)?token/i,
    /quiero\s+crear/i,
    /necesito\s+crear/i,
  ],
  transfer_token: [
    /transferir/i,
    /enviar/i,
    /mandar/i,
    /transfer/i,
    /send/i,
  ],
  accept_transfer: [
    /aceptar\s+(la\s+)?transferencia/i,
    /acepto/i,
    /accept/i,
    /aprobar\s+transferencia/i,
  ],
  reject_transfer: [
    /rechazar\s+(la\s+)?transferencia/i,
    /rechazo/i,
    /reject/i,
    /no\s+acepto/i,
  ],
  request_role: [
    /solicitar\s+(un\s+)?rol/i,
    /pedir\s+(un\s+)?rol/i,
    /quiero\s+ser/i,
    /registrarme\s+como/i,
  ],
  approve_user: [
    /aprobar\s+usuario/i,
    /aceptar\s+usuario/i,
    /approve\s+user/i,
  ],
  reject_user: [
    /rechazar\s+usuario/i,
    /denegar\s+usuario/i,
    /reject\s+user/i,
  ],
  view_tokens: [
    /ver\s+(mis\s+)?tokens/i,
    /mostrar\s+tokens/i,
    /listar\s+tokens/i,
    /qu[eé]\s+tokens/i,
  ],
  view_transfers: [
    /ver\s+(mis\s+)?transferencias/i,
    /mostrar\s+transferencias/i,
    /listar\s+transferencias/i,
    /historial/i,
  ],
  view_balance: [
    /balance/i,
    /saldo/i,
    /cantidad/i,
    /cu[aá]nto\s+tengo/i,
  ],
  help: [
    /ayuda/i,
    /help/i,
    /qu[eé]\s+puedo\s+hacer/i,
    /c[oó]mo/i,
    /comandos/i,
  ],
  unknown: [],
};

// Extractor de entidades (números, direcciones, etc.)
export function extractEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // Extraer números (para cantidades, IDs)
  const numbers = message.match(/\d+/g);
  if (numbers) {
    entities.numbers = numbers.map(n => parseInt(n));
    if (numbers.length === 1) {
      entities.amount = parseInt(numbers[0]);
      entities.tokenId = parseInt(numbers[0]);
    }
  }

  // Extraer direcciones Ethereum
  const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    entities.address = addressMatch[0];
  }

  // Extraer nombres de roles
  const roles = ['PRODUCER', 'FACTORY', 'RETAILER', 'CONSUMER'];
  for (const role of roles) {
    if (new RegExp(role, 'i').test(message)) {
      entities.role = role;
      break;
    }
  }

  // Extraer nombres de tokens (palabras entre comillas)
  const nameMatch = message.match(/"([^"]+)"|'([^']+)'/);
  if (nameMatch) {
    entities.name = nameMatch[1] || nameMatch[2];
  }

  return entities;
}

/**
 * Detecta la intención del usuario basándose en patrones
 */
export function detectIntent(message: string): DetectedIntent {
  const normalizedMessage = message.toLowerCase().trim();

  let bestIntent: Intent = 'unknown';
  let maxConfidence = 0;

  // Buscar coincidencias con los patrones
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
        const confidence = 0.8; // Confianza base para coincidencias de patrón
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestIntent = intent as Intent;
        }
      }
    }
  }

  // Si no se encontró ningún patrón, intentar con palabras clave
  if (bestIntent === 'unknown') {
    if (normalizedMessage.includes('token') && !normalizedMessage.includes('transferencia')) {
      bestIntent = 'view_tokens';
      maxConfidence = 0.5;
    } else if (normalizedMessage.includes('transferencia')) {
      bestIntent = 'view_transfers';
      maxConfidence = 0.5;
    }
  }

  const entities = extractEntities(message);

  return {
    intent: bestIntent,
    confidence: maxConfidence,
    entities,
    rawMessage: message,
  };
}

/**
 * Genera respuesta de ayuda con comandos disponibles
 */
export function getHelpMessage(): string {
  return `
🤖 **Asistente de Supply Chain** - Comandos disponibles:

**📦 Gestión de Tokens:**
- "Crear un token" - Inicia el proceso para crear un nuevo token
- "Ver mis tokens" - Muestra tus tokens
- "Ver balance del token X" - Muestra el balance de un token específico

**📤 Transferencias:**
- "Transferir token X a [dirección]" - Inicia una transferencia
- "Aceptar transferencia X" - Acepta una transferencia pendiente
- "Rechazar transferencia X" - Rechaza una transferencia pendiente
- "Ver mis transferencias" - Muestra tu historial

**👥 Gestión de Usuarios:**
- "Solicitar rol de PRODUCER" - Solicita registrarte como productor
- "Aprobar usuario [dirección]" - (Admin) Aprueba un usuario
- "Rechazar usuario [dirección]" - (Admin) Rechaza un usuario

**ℹ️ Consultas:**
- "Ayuda" - Muestra este mensaje
- "Cómo funciona" - Explica el sistema

Puedes escribir en lenguaje natural y el asistente intentará entender tu intención.
  `.trim();
}
