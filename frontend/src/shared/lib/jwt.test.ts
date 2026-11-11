import { describe, it, expect } from "vitest";
import { decodeJwtPayload, isJwtExpired } from "./jwt";

function createMockJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "dummy_signature";
  return `${header}.${body}.${signature}`;
}

describe("jwt utilities", () => {
  it("decodeJwtPayload debe devolver null para valores nulos, vacíos o mal formados", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(undefined)).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(decodeJwtPayload("a.b")).toBeNull();
  });

  it("decodeJwtPayload debe decodificar correctamente un JWT válido", () => {
    const payload = { sub: "user-123", email: "test@example.com", exp: 1800000000 };
    const jwt = createMockJwt(payload);

    const decoded = decodeJwtPayload(jwt);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("user-123");
    expect(decoded?.email).toBe("test@example.com");
    expect(decoded?.exp).toBe(1800000000);
  });

  it("isJwtExpired debe devolver true para tokens nulos o vacíos", () => {
    expect(isJwtExpired(null)).toBe(true);
    expect(isJwtExpired(undefined)).toBe(true);
    expect(isJwtExpired("")).toBe(true);
  });

  it("isJwtExpired debe devolver false para tokens de prueba sintéticos sin exp", () => {
    expect(isJwtExpired("mock.jwt.token")).toBe(false);
  });

  it("isJwtExpired debe devolver false para tokens vigentes en el futuro", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // +1 hora
    const jwt = createMockJwt({ exp: futureExp });
    expect(isJwtExpired(jwt)).toBe(false);
  });

  it("isJwtExpired debe devolver true para tokens expirados en el pasado", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60; // -1 minuto
    const jwt = createMockJwt({ exp: pastExp });
    expect(isJwtExpired(jwt)).toBe(true);
  });

  it("isJwtExpired debe devolver true para tokens a punto de expirar dentro de la ventana de gracia", () => {
    const expiringSoonExp = Math.floor(Date.now() / 1000) + 15; // +15 segundos (ventana de gracia es 30s)
    const jwt = createMockJwt({ exp: expiringSoonExp });
    expect(isJwtExpired(jwt, 30)).toBe(true);
  });
});
