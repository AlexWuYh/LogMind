"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PROMPTS } from "@/lib/prompts";

import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  ai_provider: z.enum(["openai", "azure", "custom"]),
  ai_base_url: z.string().optional(),
  ai_api_key: z.string().min(1, "API Key 不能为空"),
  ai_model: z.string().min(1, "模型名称不能为空"),
  prompt_daily: z.string().optional(),
  prompt_weekly: z.string().optional(),
  prompt_monthly: z.string().optional(),
  prompt_yearly: z.string().optional(),
  schedule_weekly: z.boolean().default(true),
  schedule_monthly: z.boolean().default(true),
  schedule_yearly: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_provider: "openai",
      ai_base_url: "https://api.openai.com/v1",
      ai_api_key: "",
      ai_model: "gpt-4-turbo",
      prompt_daily: DEFAULT_PROMPTS.daily_summary,
      prompt_weekly: DEFAULT_PROMPTS.weekly_report,
      prompt_monthly: DEFAULT_PROMPTS.monthly_report,
      prompt_yearly: DEFAULT_PROMPTS.yearly_report,
      schedule_weekly: true,
      schedule_monthly: true,
      schedule_yearly: true,
    },
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length > 0) {
          form.reset({
            ai_provider: data.ai_provider || "openai",
            ai_base_url: data.ai_base_url || "https://api.openai.com/v1",
            ai_api_key: data.ai_api_key || "",
            ai_model: data.ai_model || "gpt-4-turbo",
            prompt_daily: data.prompt_daily || DEFAULT_PROMPTS.daily_summary,
            prompt_weekly: data.prompt_weekly || DEFAULT_PROMPTS.weekly_report,
            prompt_monthly: data.prompt_monthly || DEFAULT_PROMPTS.monthly_report,
            prompt_yearly: data.prompt_yearly || DEFAULT_PROMPTS.yearly_report,
            schedule_weekly: data.schedule_weekly !== "false", // Default true
            schedule_monthly: data.schedule_monthly !== "false",
            schedule_yearly: data.schedule_yearly !== "false",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({
        title: "成功",
        description: "设置已保存",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "保存设置失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">系统设置</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai">AI 连接配置</TabsTrigger>
              <TabsTrigger value="prompts">Prompt 模板</TabsTrigger>
              <TabsTrigger value="schedule">定时任务</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI 模型连接</CardTitle>
                  <CardDescription>配置 LLM API 连接信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="ai_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>提供商</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="选择提供商" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="azure">Azure OpenAI</SelectItem>
                            <SelectItem value="custom">Custom (Local/Other)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ai_base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>默认: https://api.openai.com/v1</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ai_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ai_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>模型名称</FormLabel>
                        <FormControl><Input {...field} placeholder="例如: gpt-4-turbo" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts">
              <Card>
                <CardHeader>
                  <CardTitle>Prompt 模板配置</CardTitle>
                  <CardDescription>自定义生成报告和总结的 AI 提示词。使用 {"{{logs}}"} 或 {"{{items}}"} 作为占位符。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="prompt_daily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>日报总结 Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[200px] font-mono text-xs" />
                        </FormControl>
                        <FormDescription>用于生成每日工作总结。占位符: {"{{items}}"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="prompt_weekly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>周报生成 Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[200px] font-mono text-xs" />
                        </FormControl>
                        <FormDescription>用于生成周报。占位符: {"{{logs}}"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>月报生成 Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[200px] font-mono text-xs" />
                        </FormControl>
                        <FormDescription>用于生成月报。占位符: {"{{logs}}"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt_yearly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>年报生成 Prompt</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[200px] font-mono text-xs" />
                        </FormControl>
                        <FormDescription>用于生成年报。占位符: {"{{logs}}"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>定时任务配置</CardTitle>
                  <CardDescription>配置自动生成报告的定时任务。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="schedule_weekly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">自动生成周报</FormLabel>
                          <FormDescription>每周一凌晨 02:00 自动生成上周周报</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule_monthly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">自动生成月报</FormLabel>
                          <FormDescription>每月 1 日凌晨 03:00 自动生成上月月报</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule_yearly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">自动生成年报</FormLabel>
                          <FormDescription>每年 1 月 1 日凌晨 04:00 自动生成上一年年报</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
             <Button type="submit" disabled={saving} size="lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              保存所有配置
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
