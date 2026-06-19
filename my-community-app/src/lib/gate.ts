const SHELLY_URL  = 'https://shelly-116-eu.shelly.cloud/v2/devices/api/set/switch'
const AUTH_KEY    = 'MjZhMTkydWlk59C82746CEDA29CE3AD78A896542A8F35F87FF9277026B2EEF7BE7ACF9818EECCDFB9F619FC15524'

const GATE_DEVICES = {
  enter: '28372f2b6970',
  exit:  '28372f294180',
}

async function callRelay(deviceId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SHELLY_URL}?auth_key=${AUTH_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deviceId, auth_key: AUTH_KEY, channel: 0, on: true }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function triggerGate(enter: boolean): Promise<boolean> {
  return callRelay(enter ? GATE_DEVICES.enter : GATE_DEVICES.exit)
}
