"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const SCAN_INTERVAL_MS = 200;
const COOLDOWN_MS = 2500;

/**
 * Prende la cámara del dispositivo y lee códigos QR de los frames de video con
 * jsQR. Llama a `onDetect(payload)` cada vez que reconoce uno, con una pausa
 * corta después para no reenviar el mismo QR varias veces seguidas.
 */
export function QrScanner({
  active,
  onDetect,
}: {
  active: boolean;
  onDetect: (payload: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const onDetectRef = useRef(onDetect);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      const now = performance.now();
      if (now - lastScanRef.current < SCAN_INTERVAL_MS) return;
      lastScanRef.current = now;
      if (now < cooldownUntilRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        cooldownUntilRef.current = now + COOLDOWN_MS;
        onDetectRef.current(code.data);
      }
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setError(null);
        tick();
      } catch {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full max-w-sm overflow-hidden rounded-md border bg-black">
        <video ref={videoRef} className="w-full" muted playsInline />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Apunta la cámara al QR del socio.</p>
      )}
    </div>
  );
}
