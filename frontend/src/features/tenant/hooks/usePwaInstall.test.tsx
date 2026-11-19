import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePwaInstall, resetPwaInstallState } from "./usePwaInstall";

function HookTester({
  onHookReady,
}: {
  onHookReady: (hook: ReturnType<typeof usePwaInstall>) => void;
}) {
  const hook = usePwaInstall();
  React.useEffect(() => {
    onHookReady(hook);
  }, [hook, onHookReady]);
  return <div data-installed={hook.isInstalled} data-prompt={hook.hasPrompt} />;
}

describe("usePwaInstall Hook", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    resetPwaInstallState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    resetPwaInstallState();
  });

  it("inicializa correctamente cuando no está instalada", async () => {
    let currentHook: ReturnType<typeof usePwaInstall> | null = null;

    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    expect(currentHook).not.toBeNull();
    expect(currentHook!.isInstalled).toBe(false);
    expect(currentHook!.hasPrompt).toBe(false);
  });

  it("captura el evento beforeinstallprompt y expone triggerInstall", async () => {
    let currentHook: ReturnType<typeof usePwaInstall> | null = null;

    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = Object.assign(new Event("beforeinstallprompt"), {
      platforms: ["web"],
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      prompt: mockPrompt,
    });

    await act(async () => {
      window.dispatchEvent(mockEvent);
    });

    expect(currentHook!.hasPrompt).toBe(true);

    let installed = false;
    await act(async () => {
      installed = await currentHook!.triggerInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(installed).toBe(true);
    expect(currentHook!.isInstalled).toBe(true);
  });

  it("actualiza estado cuando se emite el evento appinstalled", async () => {
    let currentHook: ReturnType<typeof usePwaInstall> | null = null;

    await act(async () => {
      root.render(
        <HookTester
          onHookReady={(h) => {
            currentHook = h;
          }}
        />
      );
    });

    await act(async () => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(currentHook!.isInstalled).toBe(true);
    expect(currentHook!.hasPrompt).toBe(false);
  });
});
