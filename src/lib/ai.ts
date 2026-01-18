import { prisma } from "./prisma";

interface LogData {
  date: string;
  project?: string | null;
  summary?: string | null;
  progress: number;
  priority?: string | null;
  items: {
    content: string;
    project?: string | null;
    priority?: string | null;
    progress: number;
  }[];
  tomorrowPlan?: string | null;
}

import { DEFAULT_PROMPTS } from "./prompts";

export async function generateReport(type: "WEEKLY" | "MONTHLY" | "YEARLY", startDate: string, endDate: string, userId?: string) {
  // 1. Fetch Data
  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.user.findFirst();
  }
  
  if (!user) throw new Error("User not found");

  let sourceText = "";

  if (type === "WEEKLY") {
    // Source: Daily Logs
    const logs = await prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      include: { items: true },
      orderBy: { date: "asc" },
    });

    if (logs.length === 0) throw new Error("No daily logs found for this period");
    
    sourceText = logs.map(log => `
Date: ${log.date}
Project: ${log.project || "N/A"}
Progress: ${log.progress}%
Items:
${log.items.map(i => `- [${i.priority || "Normal"}] ${i.content} (${i.progress}%)`).join("\n")}
Tomorrow: ${log.tomorrowPlan || "N/A"}
`).join("\n---\n");

  } else if (type === "MONTHLY") {
    // Source: Weekly Reports
    // Note: periodStart is YYYY-MM-DD. We look for reports that started within this month range.
    const reports = await prisma.report.findMany({
      where: {
        userId: user.id,
        type: "WEEKLY",
        periodStart: { gte: startDate, lte: endDate },
      },
      orderBy: { periodStart: "asc" },
    });

    if (reports.length === 0) throw new Error("No weekly reports found for this month");

    sourceText = reports.map(r => `
Weekly Report (${r.periodStart} to ${r.periodEnd})
Content:
${r.content}
`).join("\n---\n");

  } else if (type === "YEARLY") {
    // Source: Monthly Reports
    const reports = await prisma.report.findMany({
      where: {
        userId: user.id,
        type: "MONTHLY",
        periodStart: { gte: startDate, lte: endDate },
      },
      orderBy: { periodStart: "asc" },
    });

    if (reports.length === 0) throw new Error("No monthly reports found for this year");

    sourceText = reports.map(r => `
Monthly Report (${r.periodStart})
Content:
${r.content}
`).join("\n---\n");
  }

  // 2. Fetch Config & Build Prompt
  const config = await getAIConfig();
  const prompt = buildPrompt(type, sourceText, config.prompts);

  // 3. Call LLM
  const reportContent = await callLLM(prompt, config);

  // 4. Save Report
  const report = await prisma.report.create({
    data: {
      userId: user.id,
      type,
      periodStart: startDate,
      periodEnd: endDate,
      content: reportContent,
      model: config.model,
      status: "GENERATED",
    },
  });

  return report;
}

async function getAIConfig() {
  const configs = await prisma.systemConfig.findMany();
  const map: Record<string, string> = {};
  configs.forEach(c => map[c.key] = c.value);
  
  if (!map.ai_api_key) throw new Error("AI API Key not configured in Settings");
  
  return {
    apiKey: map.ai_api_key,
    baseUrl: map.ai_base_url || "https://api.openai.com/v1",
    model: map.ai_model || "gpt-4-turbo",
    prompts: {
      daily: map.prompt_daily || DEFAULT_PROMPTS.daily_summary,
      weekly: map.prompt_weekly || DEFAULT_PROMPTS.weekly_report,
      monthly: map.prompt_monthly || DEFAULT_PROMPTS.monthly_report,
      yearly: map.prompt_yearly || DEFAULT_PROMPTS.yearly_report,
    }
  };
}

function buildPrompt(type: string, sourceText: string, prompts: Record<string, string>) {
  let basePrompt = "";
  switch (type) {
    case "WEEKLY":
      basePrompt = prompts.weekly;
      break;
    case "MONTHLY":
      basePrompt = prompts.monthly;
      break;
    case "YEARLY":
      basePrompt = prompts.yearly;
      break;
    default:
      basePrompt = DEFAULT_PROMPTS.weekly_report;
  }

  // Support both {{logs}} and {{items}} placeholders for backward compatibility
  return basePrompt.replace("{{logs}}", sourceText).replace("{{items}}", sourceText);
}

async function callLLM(prompt: string, config: { apiKey: string, baseUrl: string, model: string }) {
  // Handle trailing slash
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  const url = `${baseUrl}/chat/completions`;
  
  // Some providers don't support response_format: { type: "json_object" } (e.g. older models or some local LLMs)
  // We can try to detect or just send it if supported, or rely on prompt engineering.
  // OpenAI and Azure support it for recent models. 
  // For broad compatibility, we might remove it if the model isn't gpt-4-turbo/gpt-3.5-turbo-1106 etc,
  // OR we just rely on the prompt being very strict (which we updated).
  // However, forcing it is safer if supported.
  // Let's make it optional based on a simple check or try/catch logic, but for now we keep it simple.
  // Update: Many providers (DeepSeek, Qwen) might not strictly support the `json_object` param in the API yet, causing 400 errors.
  // Safer to remove it and rely on prompt engineering unless we know it's OpenAI.
  
  const isOpenAI = config.baseUrl.includes("openai.com");
  const body: any = {
      model: config.model,
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt }
      ],
  };

  if (isOpenAI) {
      body.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // Clean markdown code blocks if present (common issue with non-OpenAI models)
  if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  // Ensure content is valid JSON string
  try {
    JSON.parse(content);
    return content;
  } catch (e) {
    console.error("LLM returned invalid JSON", content);
    throw new Error("LLM returned invalid JSON format");
  }
}
