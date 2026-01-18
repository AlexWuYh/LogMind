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
  // 1. Fetch Logs
  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.user.findFirst();
  }
  
  if (!user) throw new Error("User not found");

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate },
    },
    include: { items: true },
    orderBy: { date: "asc" },
  });

  if (logs.length === 0) {
    throw new Error("No logs found for this period");
  }

  // 2. Fetch Config & Build Prompt
  const config = await getAIConfig();
  const prompt = buildPrompt(type, logs, config.prompts);

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

function buildPrompt(type: string, logs: LogData[], prompts: Record<string, string>) {
  const logsText = logs.map(log => `
Date: ${log.date}
Project: ${log.project || "N/A"}
Progress: ${log.progress}%
Items:
${log.items.map(i => `- [${i.priority || "Normal"}] ${i.content} (${i.progress}%)`).join("\n")}
Tomorrow: ${log.tomorrowPlan || "N/A"}
`).join("\n---\n");

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

  return basePrompt.replace("{{logs}}", logsText);
}

async function callLLM(prompt: string, config: { apiKey: string, baseUrl: string, model: string }) {
  // Handle trailing slash
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  const url = `${baseUrl}/chat/completions`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Ensure content is valid JSON string
  try {
    JSON.parse(content);
    return content;
  } catch (e) {
    console.error("LLM returned invalid JSON", content);
    throw new Error("LLM returned invalid JSON format");
  }
}
