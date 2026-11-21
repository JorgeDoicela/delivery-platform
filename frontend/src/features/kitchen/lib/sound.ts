// Web Audio API sintetizado nativo para alertas de cocina/mostrador sin dependencias pesadas

class KitchenAudioAlert {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  constructor() {
    this.setupGlobalUnlock();
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  /**
   * Registra oyentes pasivos en los primeros gestos del usuario (clic, toque o teclado)
   * para reanudar y desbloquear el AudioContext de forma transparente según el Autoplay Policy.
   */
  private setupGlobalUnlock() {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlockAudio();
      if (this.isUnlocked) {
        window.removeEventListener("click", unlockHandler, true);
        window.removeEventListener("keydown", unlockHandler, true);
        window.removeEventListener("touchstart", unlockHandler, true);
      }
    };

    window.addEventListener("click", unlockHandler, { capture: true, passive: true });
    window.addEventListener("keydown", unlockHandler, { capture: true, passive: true });
    window.addEventListener("touchstart", unlockHandler, { capture: true, passive: true });
  }

  /**
   * Desbloquea silenciosamente el AudioContext en segundo plano con cualquier interacción.
   */
  unlockAudio(): void {
    const ctx = this.initContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {
        // El navegador aún no permite reproducir sin gesto directo
      });
    } else if (ctx.state === "running") {
      this.isUnlocked = true;
    }
  }

  /**
   * Genera un pulso acústico con armónicos y envolvente exponencial suave (ADSR).
   */
  private playTone(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    peakVolume: number
  ) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fundamental (senoidal pura y redonda)
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, startTime);

    // Armónico campana (triangular para presencia metálica penetrante en cocina)
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envolvente de volumen (ataque de 20ms y decaimiento exponencial)
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start(startTime);
    osc1.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
  }

  /**
   * Notificación acústica de comanda notoria y profesional:
   * Secuencia melódica de doble acorde ascendente (triada F5 -> A5 -> C6 repetida con refuerzo en D6),
   * nítida y con presencia para cortar el ruido ambiental de cocinas y mostradores.
   */
  playNewOrderChime() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.connect(ctx.destination);

      // Frase 1: Triada de aviso inicial (F5: 698.46Hz, A5: 880Hz, C6: 1046.5Hz)
      this.playTone(ctx, masterGain, 698.46, now, 0.18, 0.45);
      this.playTone(ctx, masterGain, 880.0, now + 0.12, 0.18, 0.55);
      this.playTone(ctx, masterGain, 1046.5, now + 0.24, 0.35, 0.7);

      // Frase 2: Segundo pulso de confirmación reforzado para captar atención (+0.48s)
      const phrase2 = now + 0.48;
      this.playTone(ctx, masterGain, 880.0, phrase2, 0.16, 0.5);
      this.playTone(ctx, masterGain, 1174.66, phrase2 + 0.12, 0.45, 0.8); // D6 resonante
    } catch {
      // AudioContext bloqueado si el navegador aún no detectó interacción
    }
  }
}

export const kitchenAlertSound = new KitchenAudioAlert();
