import API_BASE from "../config/api"
import type { PersonalIoTLiveResponse } from "../types/iot"

export async function getLatestIoT() {
  const response = await fetch(`${API_BASE}/iot/latest`)
  if (!response.ok) {
    throw new Error("Failed to fetch latest IoT data")
  }
  return response.json()
}

export async function getIoTHistory() {
  const response = await fetch(`${API_BASE}/iot/history`)
  if (!response.ok) {
    throw new Error("Failed to fetch IoT history")
  }
  return response.json()
}

export async function getIoTUnresolvedAlerts() {
  const response = await fetch(`${API_BASE}/iot/alerts/unresolved`)
  if (!response.ok) {
    throw new Error("Failed to fetch IoT unresolved alerts")
  }
  return response.json()
}

export async function getPersonalLiveIoT(): Promise<PersonalIoTLiveResponse> {
  const response = await fetch(`${API_BASE}/iot/personal/live`)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail || "Failed to fetch personal IoT data")
  }
  return response.json()
}

export function getPersonalLiveIoTWebSocketUrl(): string {
  const url = new URL(API_BASE)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${url.host}/ws/iot/personal/live`
}
