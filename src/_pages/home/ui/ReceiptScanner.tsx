import { AlertTriangle, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { decodeQrPixels } from "@/_pages/home/model/receipt-image";
import { cameraFailureMessage } from "@/_pages/home/model/receipt-scanner";

interface ReceiptScannerProps {
  onDetected: (payload: string) => void;
}

export default function ReceiptScanner({ onDetected }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let stop: (() => void) | undefined;

    async function begin(): Promise<void> {
      try {
        if (!videoRef.current || disposed) {
          return;
        }

        const video = videoRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } }
        });
        let animationFrame = 0;

        stop = () => {
          cancelAnimationFrame(animationFrame);
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        };

        if (disposed) {
          stop();
          return;
        }

        video.srcObject = stream;
        await video.play();

        if (disposed) {
          stop();
          return;
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          throw new Error("Canvas is unavailable");
        }

        let lastScanAt = 0;

        const scanFrame = (timestamp: number): void => {
          if (disposed) {
            return;
          }

          if (timestamp - lastScanAt >= 180 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            lastScanAt = timestamp;
            const scale = Math.min(1, 960 / video.videoWidth);
            const width = Math.max(1, Math.round(video.videoWidth * scale));
            const height = Math.max(1, Math.round(video.videoHeight * scale));
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            const pixels = context.getImageData(0, 0, width, height);
            const payload = decodeQrPixels(pixels.data, width, height);

            if (payload) {
              disposed = true;
              stop?.();
              onDetected(payload);
              return;
            }
          }

          animationFrame = requestAnimationFrame(scanFrame);
        };

        animationFrame = requestAnimationFrame(scanFrame);
      } catch (caught) {
        if (!disposed) {
          stop?.();
          setError(cameraFailureMessage(window.isSecureContext, caught));
        }
      }
    }

    void begin();

    return () => {
      disposed = true;
      stop?.();
    };
  }, [onDetected]);

  return (
    <div className="scanner" aria-label="Сканер QR-кода">
      {error ? (
        <p className="inline-message error-message" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {error}
        </p>
      ) : (
        <div className="camera-frame">
          <video ref={videoRef} autoPlay muted playsInline />
          <span className="scan-corner top-left" />
          <span className="scan-corner top-right" />
          <span className="scan-corner bottom-left" />
          <span className="scan-corner bottom-right" />
          <Camera size={22} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
