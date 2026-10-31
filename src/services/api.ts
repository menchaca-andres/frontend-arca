const GATEWAY_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiService {
  static async health(): Promise<{ service: string; status: string }> {
    const res = await fetch(`${GATEWAY_ORIGIN}/health`);
    return res.json();
  }
}
