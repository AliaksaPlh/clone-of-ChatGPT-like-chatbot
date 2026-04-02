export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  },

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  },
};
