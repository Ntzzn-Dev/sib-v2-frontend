const API = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Não foi possível acessar o SIB v2 em ${API}. Inicie a API Spring Boot e tente novamente.`,
    );
  }
  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(
      body.detail ||
        body.message ||
        body.error ||
        `Falha na API (${response.status})`,
    );
  }
  if (response.status === 204) return null;
  return response.json();
}

export const jsonRequest = (method, body) => ({
  method,
  body: JSON.stringify(body),
});
