import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const VALID_CATEGORIES = new Set(["identidad", "banners", "menu", "general"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tenantSlug = (formData.get("tenantSlug") as string | null)?.trim().toLowerCase() || "shared";
    const category = (formData.get("category") as string | null)?.trim().toLowerCase() || "general";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de imagen." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Solo se admiten imágenes WebP, PNG, JPEG o SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido de 5 MB." },
        { status: 400 }
      );
    }

    // Sanitizar slug y categoría para evitar path traversal
    const safeTenantSlug = tenantSlug.replace(/[^a-z0-9-]/g, "") || "shared";
    const safeCategory = VALID_CATEGORIES.has(category) ? category : "general";

    // Generar nombre único con timestamp y extensión
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const safeBaseName = file.name
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 30);
    const uniqueFileName = `${safeBaseName}-${Date.now()}.${extension}`;

    // Directorio de destino: public/images/tenants/{tenantSlug}/{category}/
    const uploadDirPath = join(
      process.cwd(),
      "public",
      "images",
      "tenants",
      safeTenantSlug,
      safeCategory
    );

    if (!existsSync(uploadDirPath)) {
      await mkdir(uploadDirPath, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDirPath, uniqueFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/images/tenants/${safeTenantSlug}/${safeCategory}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error interno al procesar y guardar la imagen.",
        details: error instanceof Error ? error.message : "Desconocido",
      },
      { status: 500 }
    );
  }
}

