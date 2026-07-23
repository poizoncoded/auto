import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ClipboardPaste,
  ImageUp,
  LoaderCircle,
  ShieldCheck,
  X,
  type LucideIcon
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent
} from "react";

import {
  receiptImportSources,
  resolveCameraMode,
  type ReceiptImportSource
} from "@/_pages/home/model/receipt-import-flow";
import {
  canUseLiveCamera,
  requestDevelopmentCameraHandoff,
  resolveDevelopmentCameraUrl
} from "@/_pages/home/model/receipt-scanner";

const ReceiptScanner = lazy(() => import("./ReceiptScanner"));

interface ReceiptImportSheetProps {
  error: string | null;
  initialSource?: ReceiptImportSource | null;
  onClose: () => void;
  onSubmitPayload: (payload: string) => Promise<boolean>;
  saving: boolean;
}

const sourceIcons: Record<ReceiptImportSource, LucideIcon> = {
  camera: Camera,
  manual: ClipboardPaste,
  photo: ImageUp
};

const subscribeToCameraEnvironment = () => () => undefined;

function getLiveCameraSnapshot(): boolean {
  return canUseLiveCamera({
    isSecureContext: window.isSecureContext,
    mediaDevices: navigator.mediaDevices
  });
}

export default function ReceiptImportSheet({
  error,
  initialSource = null,
  onClose,
  onSubmitPayload,
  saving
}: ReceiptImportSheetProps) {
  const liveCameraAvailable = useSyncExternalStore(subscribeToCameraEnvironment, getLiveCameraSnapshot, () => false);
  const cameraMode = resolveCameraMode({ liveCameraAvailable });
  const sheetRef = useRef<HTMLElement>(null);
  const [source, setSource] = useState<ReceiptImportSource | null>(initialSource);
  const [rawPayload, setRawPayload] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [developmentCameraUrl, setDevelopmentCameraUrl] = useState<string | null>(null);
  const [loadingDevelopmentCameraUrl, setLoadingDevelopmentCameraUrl] = useState(false);
  const [openingDevelopmentCamera, setOpeningDevelopmentCamera] = useState(false);
  const [developmentCameraError, setDevelopmentCameraError] = useState<string | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheetRef.current?.focus();

    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, saving]);

  useEffect(() => {
    if (source !== "camera" || cameraMode !== "https-required") {
      return;
    }

    let cancelled = false;
    let retryTimer: number | undefined;

    async function loadDevelopmentCameraUrl(): Promise<void> {
      setLoadingDevelopmentCameraUrl(true);
      let resolvedUrl: string | null = null;

      try {
        const response = await fetch("/api/development/https-url", { cache: "no-store" });

        if (response.ok) {
          const payload = await response.json() as { url?: unknown };
          resolvedUrl = resolveDevelopmentCameraUrl(payload.url, window.location.pathname);
        }
      } catch {
        // Photo remains available while the development tunnel starts or reconnects.
      }

      if (cancelled) {
        return;
      }

      setDevelopmentCameraUrl(resolvedUrl);
      setLoadingDevelopmentCameraUrl(false);

      if (!resolvedUrl) {
        retryTimer = window.setTimeout(() => void loadDevelopmentCameraUrl(), 2000);
      }
    }

    void loadDevelopmentCameraUrl();

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [cameraMode, source]);

  const submitDetectedPayload = useCallback(
    (payload: string) => {
      void onSubmitPayload(payload);
    },
    [onSubmitPayload]
  );

  function chooseSource(nextSource: ReceiptImportSource): void {
    setDevelopmentCameraUrl(null);
    setDevelopmentCameraError(null);
    setLoadingDevelopmentCameraUrl(nextSource === "camera" && cameraMode === "https-required");
    setSource(nextSource);
  }

  async function openDevelopmentCamera(): Promise<void> {
    if (openingDevelopmentCamera) {
      return;
    }

    setOpeningDevelopmentCamera(true);
    setDevelopmentCameraError(null);

    try {
      window.location.assign(await requestDevelopmentCameraHandoff());
    } catch (caught) {
      setDevelopmentCameraError(
        caught instanceof Error ? caught.message : "Не удалось открыть защищённую камеру"
      );
      setOpeningDevelopmentCamera(false);
    }
  }

  async function readImage(
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    chooseSource("photo");
    setReadingImage(true);
    setImageError(null);

    try {
      const { decodeReceiptQrImage } = await import("@/_pages/home/model/receipt-image");
      const payload = await decodeReceiptQrImage(file);

      if (!payload) {
        setImageError("QR-код на изображении не найден. Попробуйте ещё раз или выберите другой способ.");
        return;
      }

      await onSubmitPayload(payload);
    } catch {
      setImageError("Не удалось открыть изображение. Попробуйте другое фото или выберите другой способ.");
    } finally {
      setReadingImage(false);
    }
  }

  function backToSources(): void {
    if (saving) {
      return;
    }

    setSource(null);
    setDevelopmentCameraUrl(null);
    setDevelopmentCameraError(null);
    setLoadingDevelopmentCameraUrl(false);
    setOpeningDevelopmentCamera(false);
    setImageError(null);
    setRawPayload("");
  }

  function photoInput(): React.ReactNode {
    return (
      <input
        accept="image/*"
        aria-label="Выбрать фото"
        autoFocus
        className="receipt-native-file-control"
        disabled={readingImage || saving}
        type="file"
        onChange={(event) => void readImage(event)}
      />
    );
  }

  function renderSourcePicker(): React.ReactNode {
    return (
      <div className="receipt-source-list" aria-label="Способ добавления чека" role="group">
        {receiptImportSources.map((item) => {
          const SourceIcon = sourceIcons[item.id];

          return (
            <button className="receipt-source-option" key={item.id} type="button" onClick={() => chooseSource(item.id)}>
              <span className="receipt-source-icon"><SourceIcon size={22} aria-hidden="true" /></span>
              <span className="receipt-source-copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  function renderStep(): React.ReactNode {
    if (!source) {
      return renderSourcePicker();
    }

    if (source === "manual") {
      return (
        <form
          className="receipt-payload-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmitPayload(rawPayload);
          }}
        >
          <label className="field">
            <span>QR-строка</span>
            <textarea
              autoFocus
              rows={4}
              value={rawPayload}
              placeholder="t=...&s=...&fn=..."
              onChange={(event) => setRawPayload(event.target.value)}
            />
          </label>
          {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
          <button className="primary-button" disabled={saving || !rawPayload.trim()} type="submit">
            {saving ? <LoaderCircle className="spinning" size={18} aria-hidden="true" /> : <ClipboardPaste size={18} aria-hidden="true" />}
            {saving ? "Разбираем" : "Продолжить"}
          </button>
        </form>
      );
    }

    if (source === "camera") {
      if (cameraMode === "https-required") {
        return (
          <div className="camera-unavailable-state" role="status">
            <AlertTriangle size={26} aria-hidden="true" />
            <strong>Для камеры нужен HTTPS</strong>
            <p>
              {developmentCameraUrl
                ? "Защищённая камера готова. Откройте её и разрешите доступ браузеру."
                : loadingDevelopmentCameraUrl
                  ? "Ищем защищённый адрес камеры…"
                  : "Защищённый адрес пока не запущен. Можно выбрать готовое фото."}
            </p>
            {developmentCameraUrl ? (
              <button
                className="primary-button camera-https-link"
                disabled={openingDevelopmentCamera}
                type="button"
                onClick={() => void openDevelopmentCamera()}
              >
                {openingDevelopmentCamera ? (
                  <LoaderCircle className="spinning" size={18} aria-hidden="true" />
                ) : (
                  <ShieldCheck size={18} aria-hidden="true" />
                )}
                {openingDevelopmentCamera ? "Открываем камеру" : "Открыть HTTPS-камеру"}
              </button>
            ) : null}
            {developmentCameraError ? (
              <p className="inline-message error-message" role="alert">
                {developmentCameraError}
              </p>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => chooseSource("photo")}>
              <ImageUp size={18} aria-hidden="true" />
              Выбрать фото
            </button>
          </div>
        );
      }

      return (
        <div className="receipt-capture-step">
          <Suspense fallback={<p className="inline-message"><LoaderCircle className="spinning" size={17} aria-hidden="true" />Открываем камеру</p>}>
            <ReceiptScanner onDetected={submitDetectedPayload} />
          </Suspense>
          {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
        </div>
      );
    }

    return (
      <div className="receipt-capture-step" aria-live="polite">
        {readingImage || saving ? (
          <div className="receipt-reading-state">
            <LoaderCircle className="spinning" size={24} aria-hidden="true" />
            <strong>{readingImage ? "Читаем QR-код" : "Добавляем чек"}</strong>
          </div>
        ) : (
          photoInput()
        )}
        {imageError ? <p className="inline-message error-message" role="alert">{imageError}</p> : null}
        {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
      </div>
    );
  }

  const title = source === null
    ? "Как добавить чек?"
    : source === "camera"
      ? "Камера"
      : source === "photo"
        ? "Фото QR-кода"
        : "QR-строка";

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        ref={sheetRef}
        aria-labelledby="receipt-import-title"
        aria-modal="true"
        className="quick-expense-sheet receipt-import-sheet"
        role="dialog"
        tabIndex={-1}
      >
        <header className="sheet-header receipt-import-header">
          <div className="receipt-import-heading">
            {source ? (
              <button className="icon-button" disabled={saving} type="button" aria-label="Назад к выбору способа" title="Назад" onClick={backToSources}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
            ) : null}
            <div>
              <span className="eyebrow">Новый чек</span>
              <h2 id="receipt-import-title">{title}</h2>
            </div>
          </div>
          <button className="icon-button" disabled={saving} type="button" aria-label="Закрыть" title="Закрыть" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {renderStep()}
      </section>
    </div>
  );
}
