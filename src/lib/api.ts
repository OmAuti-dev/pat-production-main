import { auth } from "@clerk/nextjs";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

const MAX_RETRIES = 2;

export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}
) {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const { getToken } = auth();
      const token = await getToken();

      if (!token) {
        throw new APIError(401, 'No authentication token available');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }

      // Handle specific error cases
      if (response.status === 401) {
        if (retries < MAX_RETRIES) {
          retries++;
          continue; // Retry with fresh token
        }
        throw new APIError(401, 'Authentication failed');
      }

      throw new APIError(response.status, response.statusText);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'An unexpected error occurred');
    }
  }

  throw new APIError(401, 'Authentication failed after maximum retries');
} 