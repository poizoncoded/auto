import jsQR from "jsqr";

const maximumImageDimension = 1600;

export function decodeQrPixels(data: Uint8ClampedArray, width: number, height: number): string | null {
  if (width <= 0 || height <= 0 || data.length !== width * height * 4) {
    return null;
  }

  return jsQR(data, width, height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

async function loadImage(file: File): Promise<{
  dispose: () => void;
  height: number;
  source: CanvasImageSource;
  width: number;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        dispose: () => bitmap.close(),
        height: bitmap.height,
        source: bitmap,
        width: bitmap.width
      };
    } catch {
      // Safari can reject camera formats here even when an image element can display them.
    }
  }

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image cannot be opened"));
      image.src = imageUrl;
    });

    return {
      dispose: () => URL.revokeObjectURL(imageUrl),
      height: image.naturalHeight,
      source: image,
      width: image.naturalWidth
    };
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    throw error;
  }
}

export async function decodeReceiptQrImage(file: File): Promise<string | null> {
  const image = await loadImage(file);

  try {
    const scale = Math.min(1, maximumImageDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas is unavailable");
    }

    context.drawImage(image.source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);

    return decodeQrPixels(pixels.data, width, height);
  } finally {
    image.dispose();
  }
}
