import { Delete, LockKeyhole, Plus, UserRound } from "lucide-react";
import { useState } from "react";

import type { PublicUser } from "@/shared/api/auto";

interface AuthGateProps {
  error: string | null;
  onLogin: (userId: string, pin: string) => Promise<void>;
  onRegister: (displayName: string, pin: string) => Promise<void>;
  submitting: boolean;
  users: PublicUser[];
}

type AccessMode = "login" | "register";

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0"];

export function AuthGate({ error, onLogin, onRegister, submitting, users }: AuthGateProps) {
  const [mode, setMode] = useState<AccessMode>(users.length ? "login" : "register");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");

  const activeUserId = users.some((user) => user.id === selectedUserId)
    ? selectedUserId
    : (users[0]?.id ?? "");

  function addDigit(digit: string): void {
    setPin((current) => (current.length < 6 ? `${current}${digit}` : current));
  }

  async function submit(): Promise<void> {
    if (pin.length !== 6 || submitting) {
      return;
    }

    if (mode === "register") {
      await onRegister(displayName.trim(), pin);
      return;
    }

    if (activeUserId) {
      await onLogin(activeUserId, pin);
    }
  }

  function changeMode(nextMode: AccessMode): void {
    setMode(nextMode);
    setPin("");
  }

  const ready = pin.length === 6 && (mode === "login" ? Boolean(activeUserId) : displayName.trim().length >= 2);

  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <img src="/bg.png" alt="" />
      </div>
      <section className="auth-panel" aria-labelledby="access-heading">
        <div className="brand-lockup">
          <span className="brand-mark"><UserRound size={21} aria-hidden="true" /></span>
          <span>Auto Spendings</span>
        </div>
        <div className="auth-heading">
          <span className="eyebrow">Локальный профиль</span>
          <h1 id="access-heading">{mode === "register" ? "Новый профиль" : "Разблокировка"}</h1>
        </div>

        {mode === "login" && users.length > 0 ? (
          <div className="profile-list" aria-label="Выберите профиль">
            {users.map((user) => (
              <button
                className={`profile-choice${activeUserId === user.id ? " selected" : ""}`}
                key={user.id}
                type="button"
                aria-pressed={activeUserId === user.id}
                onClick={() => setSelectedUserId(user.id)}
              >
                <span className="profile-initial">{user.displayName.slice(0, 1).toUpperCase()}</span>
                <span>{user.displayName}</span>
              </button>
            ))}
          </div>
        ) : (
          <label className="field">
            <span>Имя профиля</span>
            <input
              autoComplete="name"
              maxLength={80}
              placeholder="Например, Анна"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        )}

        <div className="pin-area">
          <span className="field-label">Шестизначный PIN</span>
          <div className="pin-dots" aria-label={`Введено цифр: ${pin.length} из 6`}>
            {Array.from({ length: 6 }, (_, index) => (
              <span className={index < pin.length ? "filled" : ""} key={index} />
            ))}
          </div>
          <div className="keypad" aria-label="Цифровая клавиатура">
            {keypad.map((digit, index) =>
              digit ? (
                <button className="keypad-button" key={digit} type="button" onClick={() => addDigit(digit)}>
                  {digit}
                </button>
              ) : (
                <span key={`gap-${index}`} />
              )
            )}
            <button
              className="keypad-button icon-only"
              type="button"
              aria-label="Удалить последнюю цифру"
              title="Удалить"
              onClick={() => setPin((current) => current.slice(0, -1))}
            >
              <Delete size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}

        <button className="primary-button" disabled={!ready || submitting} type="button" onClick={() => void submit()}>
          <LockKeyhole size={18} aria-hidden="true" />
          {submitting ? "Проверяем" : mode === "register" ? "Создать и открыть" : "Разблокировать"}
        </button>

        {mode === "login" ? (
          <button className="text-button" type="button" onClick={() => changeMode("register")}>
            <Plus size={16} aria-hidden="true" />
            Новый профиль
          </button>
        ) : users.length > 0 ? (
          <button className="text-button" type="button" onClick={() => changeMode("login")}>
            <LockKeyhole size={16} aria-hidden="true" />
            Выбрать существующий
          </button>
        ) : null}
      </section>
    </main>
  );
}
