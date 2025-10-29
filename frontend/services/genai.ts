export async function generateFromGenAI(prompt: string, options: Record<string, any> = {}) {
  const res = await fetch('/api/genai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, options }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro no servidor: ${res.status} ${text}`);
  }
  return res.json();
}
