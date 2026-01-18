import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { baseUrl, apiKey, provider } = await req.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "请先填写 Base URL 和 API Key" }, { status: 400 });
    }

    let url = baseUrl;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    // Special handling for different providers if needed
    // Most follow OpenAI standard: GET /v1/models (where v1 is part of baseUrl usually)
    // If the user provided baseUrl includes /v1, we append /models.
    // If the user provided baseUrl is just the host, we might need to be smarter.
    // However, the convention in this app (and settings defaults) seems to include /v1.
    // e.g. https://api.openai.com/v1
    
    // Azure is different: https://management.azure.com/... or client SDK. 
    // Azure OpenAI typical endpoint: https://{resource}.openai.azure.com/openai/deployments?api-version=...
    // But standard "compatible" endpoints might be different.
    // For simplicity, we assume OpenAI-compatible /models endpoint for now, 
    // which covers DeepSeek, Qwen (DashScope compatible mode), Moonshot, etc.
    
    // Check if it's Azure, if so, we might need a different logic or warn user.
    if (provider === 'azure') {
       // Azure doesn't have a simple standard /models list endpoint that returns OpenAI format 
       // without complex auth or different URL structure. 
       // We'll skip or try standard and fail gracefully.
    }

    const fetchUrl = `${url}/models`;

    console.log(`Fetching models from: ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fetch models failed: ${response.status} ${errorText}`);
      return NextResponse.json({ error: `获取失败: ${response.status} - ${errorText.substring(0, 200)}...` }, { status: response.status });
    }

    const data = await response.json();
    
    // Standard OpenAI response: { data: [{ id: "model-name", ... }] }
    let models: string[] = [];
    if (data.data && Array.isArray(data.data)) {
      models = data.data.map((m: any) => m.id);
    } else if (Array.isArray(data)) {
      // Some non-standard might return array directly
      models = data.map((m: any) => m.id || m);
    }

    return NextResponse.json({ models });
  } catch (error: any) {
    console.error("Fetch models error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}