import { readSnapshot, writeSnapshot, type DataSnapshot } from "./dataStore"

const FILE_VERSION = 1

export async function exportBackupToFile(): Promise<void> {
  const payload = {
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    data: await readSnapshot(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `skycrm-sauvegarde-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackupFromFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const data = parsed?.data ?? parsed
  if (!data || typeof data !== "object") {
    throw new Error("Fichier de sauvegarde invalide")
  }
  await writeSnapshot(data as DataSnapshot)
}
