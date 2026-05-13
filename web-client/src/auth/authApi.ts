import {
    gatewayLogin,
    gatewayLogout,
    gatewayRegister,
    type GatewayAuthResponse,
    type GatewayLoginRequest,
    type GatewayRegisterRequest,
} from '../api/gateway'

export type AuthResponse = GatewayAuthResponse

export type RegisterRequest = GatewayRegisterRequest

export type LoginRequest = GatewayLoginRequest

export async function registerUser(
    request: RegisterRequest
): Promise<AuthResponse> {
    return gatewayRegister(request)
}

export async function loginUser(request: LoginRequest): Promise<AuthResponse> {
    return gatewayLogin(request)
}

export async function logoutUser(token: string): Promise<{ message: string }> {
    return gatewayLogout(token)
}