export const DEFAULT_PROMPTS = {
  daily_summary: `You are an AI assistant helping a user summarize their daily work.
Based on the following work items, generate a concise but comprehensive summary of the day's achievements.

Requirements:
- Highlight completed tasks and significant progress
- Mention any blockers or issues if noted
- Keep the tone professional and encouraging
- Language: Chinese (Simplified)

Daily Work Items:
{{items}}
`,
  weekly_report: `You are an assistant helping generate a professional weekly work report.

Based on the following daily work logs from this week, generate a concise weekly report.

Requirements:
- Summarize key work completed
- Highlight important projects and progress
- Mention any high-priority or critical tasks
- Do NOT invent work that is not mentioned
- Use clear bullet points
- Professional and factual tone
- Language: Chinese (Simplified)
- Output strictly in JSON format with the following structure:
{
  "summary": "Overall summary of the period",
  "key_achievements": ["achievement 1", "achievement 2"],
  "project_breakdown": [
    { "project": "Project Name", "summary": "What was done" }
  ],
  "next_plan": ["plan item 1", "plan item 2"]
}

Daily Logs:
{{logs}}
`,
  monthly_report: `You are an assistant helping generate a professional monthly work report.
Based on the following daily work logs, generate a concise monthly report.

Requirements:
- Focus on project-level progress
- Identify recurring work themes
- Summarize outcomes instead of daily details
- Highlight completed milestones
- Analyze overall progress and productivity
- Do NOT invent work that is not mentioned
- Use clear bullet points
- Professional and factual tone
- Language: Chinese (Simplified)
- Output strictly in JSON format with the following structure:
{
  "summary": "Overall summary of the period",
  "key_achievements": ["achievement 1", "achievement 2"],
  "project_breakdown": [
    { "project": "Project Name", "summary": "What was done" }
  ],
  "next_plan": ["plan item 1", "plan item 2"]
}

Daily Logs:
{{logs}}
`,
  yearly_report: `You are an assistant helping generate a professional yearly work report.
Based on the following daily work logs, generate a comprehensive yearly review.

Requirements:
- Focus on overall contributions and impact
- Group work by major projects
- Highlight long-term achievements and professional growth
- Avoid daily-level details
- Use language suitable for performance review
- Do NOT invent work that is not mentioned
- Use clear bullet points
- Professional and factual tone
- Language: Chinese (Simplified)
- Output strictly in JSON format with the following structure:
{
  "summary": "Overall summary of the period",
  "key_achievements": ["achievement 1", "achievement 2"],
  "project_breakdown": [
    { "project": "Project Name", "summary": "What was done" }
  ],
  "next_plan": ["plan item 1", "plan item 2"]
}

Daily Logs:
{{logs}}
`
};
