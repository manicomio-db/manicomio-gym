import QRCode from "qrcode";

const QR_PREFIX = "MANICOMIO-SOCIO:";

/** Contenido que se codifica en el QR de un socio. */
export function socioQrPayload(memberNumber: number): string {
  return `${QR_PREFIX}${memberNumber}`;
}

/** Extrae el número de socio de un texto leído por la cámara, o null si no es un QR válido. */
export function parseSocioQrPayload(payload: string): number | null {
  const text = payload.trim();
  if (!text.startsWith(QR_PREFIX)) return null;
  const n = Number(text.slice(QR_PREFIX.length));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Genera el QR de un socio como data URL (PNG) — se puede usar en <img src>. */
export async function generateSocioQrDataUrl(memberNumber: number): Promise<string> {
  return QRCode.toDataURL(socioQrPayload(memberNumber), {
    margin: 1,
    width: 320,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
