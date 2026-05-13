const GATEWAY_BASE_URL = 'http://localhost:8081'

export type GatewayAuthResponse = {
  userId: string
  username: string
  email: string
  token: string | null
}

export type GatewayRegisterRequest = {
  username: string
  email: string
  password: string
}

export type GatewayLoginRequest = {
  email: string
  password: string
}

async function handleGatewayResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Gateway request failed'

    try {
      const errorBody = await response.json()
      message = errorBody.message || message
    } catch {
      message = `${response.status} ${response.statusText}`
    }

    throw new Error(message)
  }

  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return response.text() as Promise<T>
}

export async function gatewayRegister(
  request: GatewayRegisterRequest
): Promise<GatewayAuthResponse> {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return handleGatewayResponse<GatewayAuthResponse>(response)
}

export async function gatewayLogin(
  request: GatewayLoginRequest
): Promise<GatewayAuthResponse> {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return handleGatewayResponse<GatewayAuthResponse>(response)
}

export async function gatewayLogout(
  token: string
): Promise<{ message: string }> {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return handleGatewayResponse<{ message: string }>(response)
}

export async function gatewayProtectedTest(token: string): Promise<string> {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/protected/test`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return handleGatewayResponse<string>(response)
}