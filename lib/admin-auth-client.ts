export const ADMIN_PASSWORD_STORAGE_KEY = 'vendorsight_admin_password'

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/auth/verify', {
    headers: { 'x-admin-password': password },
  })
  return res.ok
}

export function storeAdminPassword(password: string) {
  sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password)
}

export function getStoredAdminPassword(): string | null {
  return sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY)
}

export function clearStoredAdminPassword() {
  sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY)
}
