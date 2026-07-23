export type UserRole =
  | "owner"
  | "admin"
  | "anime_manager"
  | "manhwa_manager"
  | "manga_manager"
  | "translator"
  | "editor"
  | "manhwa_editor"
  | "anime_editor"
  | "user";

export const ROLE_LABELS: Record<string, string> = {
  owner: "👑 Owner (Kurucu)",
  admin: "🛡️ Admin (Yönetici)",
  anime_manager: "🎬 Anime Sorumlusu",
  manhwa_manager: "📚 Manhwa Sorumlusu",
  manga_manager: "📖 Manga Sorumlusu",
  translator: "🌐 Çevirmen",
  editor: "✏️ Editör",
  manhwa_editor: "🎨 Manhwa Editörü",
  anime_editor: "🎥 Anime Editörü",
  user: "👤 Okuyucu (Normal Üye)"
};

export const ADMIN_PANEL_ROLES = [
  "owner",
  "admin",
  "anime_manager",
  "manhwa_manager",
  "manga_manager"
];

export function normalizeRole(username?: string, role?: string): string {
  if (username && username.trim().toLowerCase() === "jippon") {
    return "owner";
  }
  return role || "user";
}

export function hasAdminPanelAccess(username?: string, role?: string): boolean {
  const normalized = normalizeRole(username, role);
  return ADMIN_PANEL_ROLES.includes(normalized);
}

export function canManageSeriesType(type: string, username?: string, role?: string): boolean {
  const normalized = normalizeRole(username, role);
  if (["owner", "admin"].includes(normalized)) return true;

  const targetType = type.toLowerCase();
  if (targetType === "anime") {
    return ["anime_manager", "anime_editor"].includes(normalized);
  }
  if (targetType === "manhwa") {
    return ["manhwa_manager", "manhwa_editor"].includes(normalized);
  }
  if (targetType === "manga") {
    return ["manga_manager"].includes(normalized);
  }
  return false;
}

export function canManageUsers(username?: string, role?: string): boolean {
  const normalized = normalizeRole(username, role);
  return ["owner", "admin"].includes(normalized);
}
