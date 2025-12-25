/**
 * HTTP Client for Resource Management API
 *
 * Unified fetch API wrapper with request/error handling
 * Feature: 001-resource-api-integration
 */

import { ERROR_MESSAGES, HTTP_STATUS } from './types';

// Use empty string as base URL, requests are proxied via Vite dev server
const API_BASE_URL = '';

let authToken: string | null = null;

/**
 * Set authentication token
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get error message for status code
 */
function getErrorMessage(status: number, serverMessage?: string): string {
  // Prefer server-provided message
  if (serverMessage) {
    return serverMessage;
  }
  // Use predefined error messages
  return ERROR_MESSAGES[status] || 'Request failed, please try again later';
}

/**
 * Send POST request
 *
 * @param endpoint API endpoint path
 * @param data Request payload
 * @returns Promise<TRes> Response data
 * @throws ApiError when request fails
 */
export async function apiPost<TReq, TRes>(
  endpoint: string,
  data: TReq
): Promise<TRes> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Network error
    throw new ApiError(0, 'Network connection failed, please check your network');
  }

  // Handle non-success responses
  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message;
    } catch {
      // Unable to parse error response body
    }
    throw new ApiError(response.status, getErrorMessage(response.status, errorMessage));
  }

  // Handle 201 Created response (returns created object directly)
  if (response.status === HTTP_STATUS.CREATED) {
    return response.json();
  }

  // Handle 200 response (extract data from data field)
  const result = await response.json();
  return result.data;
}

/**
 * Send POST request (returns full response wrapper)
 *
 * Use when you need access to code, message fields in response
 */
export async function apiPostRaw<TReq, TRes>(
  endpoint: string,
  data: TReq
): Promise<TRes> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  } catch (error) {
    throw new ApiError(0, 'Network connection failed, please check your network');
  }

  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message;
    } catch {
      // Unable to parse error response body
    }
    throw new ApiError(response.status, getErrorMessage(response.status, errorMessage));
  }

  return response.json();
}
