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
import { Loader2, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PROMPTS } from "@/lib/prompts";

import { Switch } from "@/components/ui/switch";

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4-turbo" },
  azure: { baseUrl: "https://{resource}.openai.azure.com", model: "gpt-4" },
  aliyun: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  volcengine: { baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-pro-32k" },
  modelscope: { baseUrl: "https://api.modelscope.cn/v1", model: "qwen-max" },
  bigmodel: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4" },
  tencent: { baseUrl: "https://api.hunyuan.cloud.tencent.com/v1", model: "hunyuan-pro" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  custom: { baseUrl: "", model: "" },
};

const LEGACY_PROVIDER_MAP: Record<string, string> = {
  qwen: "aliyun",
  doubao: "volcengine",
  zhipu: "bigmodel",
  yuanbao: "tencent",
};

const formSchema = z.object({
  ai_provider: z.enum(["openai", "azure", "custom", "aliyun", "volcengine", "modelscope", "bigmodel", "tencent", "deepseek"]),
  ai_base_url: z.string().optional(),
  ai_api_key: z.string().min(1, "API Key 不能为空"),
  ai_model: z.string().min(1, "模型名称不能为空"),
  prompt_daily: z.string().optional(),
  prompt_weekly: z.string().optional(),
  prompt_monthly: z.string().optional(),
  prompt_yearly: z.string().optional(),
  schedule_weekly: z.boolean().default(true),
  schedule_weekly_day: z.string().default("1"), // 1 = Monday
  schedule_weekly_time: z.string().default("02:00"),
  schedule_monthly: z.boolean().default(true),
  schedule_monthly_day: z.string().default("1"), // 1st day of month
  schedule_monthly_time: z.string().default("03:00"),
  schedule_yearly: z.boolean().default(true),
  schedule_yearly_month: z.string().default("1"), // January
  schedule_yearly_day: z.string().default("1"), // 1st day
  schedule_yearly_time: z.string().default("04:00"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_provider: "openai",
      ai_base_url: PROVIDER_DEFAULTS.openai.baseUrl,
      ai_api_key: "",
      ai_model: PROVIDER_DEFAULTS.openai.model,
      prompt_daily: DEFAULT_PROMPTS.daily_summary,
      prompt_weekly: DEFAULT_PROMPTS.weekly_report,
      prompt_monthly: DEFAULT_PROMPTS.monthly_report,
      prompt_yearly: DEFAULT_PROMPTS.yearly_report,
      schedule_weekly: true,
      schedule_weekly_day: "1",
      schedule_weekly_time: "02:00",
      schedule_monthly: true,
      schedule_monthly_day: "1",
      schedule_monthly_time: "03:00",
      schedule_yearly: true,
      schedule_yearly_month: "1",
      schedule_yearly_day: "1",
      schedule_yearly_time: "04:00",
    },
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Watch for provider changes to update defaults
  useEffect(() => {
    if (!isInitialized) return; // Skip if not initialized to prevent overwriting saved config

    const subscription = form.watch((value, { name, type }) => {
      if (name === "ai_provider" && type === "change") {
        const provider = value.ai_provider as string;
        if (provider && PROVIDER_DEFAULTS[provider]) {
          const defaults = PROVIDER_DEFAULTS[provider];
          form.setValue("ai_base_url", defaults.baseUrl);
          form.setValue("ai_model", defaults.model);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, form.setValue, isInitialized]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length > 0) {
          let provider = data.ai_provider || "openai";
          if (LEGACY_PROVIDER_MAP[provider]) {
            provider = LEGACY_PROVIDER_MAP[provider];
          }

          form.reset({
            ai_provider: provider,
            ai_base_url: data.ai_base_url || PROVIDER_DEFAULTS.openai.baseUrl,
            ai_api_key: data.ai_api_key || "",
            ai_model: data.ai_model || PROVIDER_DEFAULTS.openai.model,
            prompt_daily: data.prompt_daily || DEFAULT_PROMPTS.daily_summary,
            prompt_weekly: data.prompt_weekly || DEFAULT_PROMPTS.weekly_report,
            prompt_monthly: data.prompt_monthly || DEFAULT_PROMPTS.monthly_report,
            prompt_yearly: data.prompt_yearly || DEFAULT_PROMPTS.yearly_report,
            schedule_weekly: data.schedule_weekly !== "false", // Default true
            schedule_weekly_day: data.schedule_weekly_day || "1",
            schedule_weekly_time: data.schedule_weekly_time || "02:00",
            schedule_monthly: data.schedule_monthly !== "false",
            schedule_monthly_day: data.schedule_monthly_day || "1",
            schedule_monthly_time: data.schedule_monthly_time || "03:00",
            schedule_yearly: data.schedule_yearly !== "false",
            schedule_yearly_month: data.schedule_yearly_month || "1",
            schedule_yearly_day: data.schedule_yearly_day || "1",
            schedule_yearly_time: data.schedule_yearly_time || "04:00",
          });
        }
        setLoading(false);
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setIsInitialized(true);
      });
  }, [form]);

  // Load models from cache on provider/url change
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "ai_provider" || name === "ai_base_url") {
        const provider = value.ai_provider as string;
        const baseUrl = value.ai_base_url as string;
        
        if (provider && baseUrl) {
          const cacheKey = `${provider}:${baseUrl}`;
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            try {
              const { models, timestamp } = JSON.parse(cachedData);
              // Cache valid for 24 hours
              if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                setFetchedModels(models);
              } else {
                setFetchedModels([]);
              }
            } catch (e) {
              setFetchedModels([]);
            }
          } else {
            setFetchedModels([]);
          }
        }
      }
    });
    
    // Also run immediately for initial state
    const provider = form.getValues("ai_provider");
    const baseUrl = form.getValues("ai_base_url");
    if (provider && baseUrl) {
      const cacheKey = `${provider}:${baseUrl}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { models, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setFetchedModels(models);
          }
        } catch (e) {}
      }
    }

    return () => subscription.unsubscribe();
  }, [form.watch, form.getValues, isInitialized]);

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

  const fetchModels = async () => {
    const baseUrl = form.getValues("ai_base_url");
    const apiKey = form.getValues("ai_api_key");
    const provider = form.getValues("ai_provider");

    if (!baseUrl || !apiKey) {
      toast({
        title: "无法获取",
        description: "请先填写 Base URL 和 API Key",
        variant: "destructive",
      });
      return;
    }

    // Check cache first
    const cacheKey = `${provider}:${baseUrl}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { models, timestamp } = JSON.parse(cachedData);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
           setFetchedModels(models);
           toast({
             title: "获取成功 (缓存)",
             description: `已加载 ${models.length} 个模型`,
           });
           return;
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    setIsFetchingModels(true);
    setFetchedModels([]);
    
    try {
      const res = await fetch("/api/models/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch models");
      }

      if (data.models && data.models.length > 0) {
        // Filter and Sort Models
        let filteredModels = data.models as string[];
        
        // Basic filtering to remove obviously irrelevant ones (embeddings, audio, etc if not chat)
        // But most /models endpoints just return everything.
        // We'll prioritize common chat models.
        
        // Remove duplicates
        filteredModels = Array.from(new Set(filteredModels));
        
        // Simple heuristic sort: prioritize models with "gpt", "claude", "qwen", "doubao" etc.
        filteredModels.sort((a, b) => {
           const priorityKeywords = ["gpt-4", "claude-3", "qwen-max", "doubao-pro", "deepseek-chat"];
           const getPriority = (name: string) => {
             const index = priorityKeywords.findIndex(k => name.toLowerCase().includes(k));
             return index === -1 ? 999 : index;
           };
           return getPriority(a) - getPriority(b) || a.localeCompare(b);
        });

        // Limit list size if too large (e.g. > 100) to prevent UI lag, keeping top matches
        if (filteredModels.length > 100) {
           filteredModels = filteredModels.slice(0, 100);
        }

        setFetchedModels(filteredModels);
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          models: filteredModels,
          timestamp: Date.now()
        }));

        toast({
          title: "获取成功",
          description: `已获取 ${filteredModels.length} 个模型`,
        });
      } else {
        toast({
          title: "提示",
          description: "未找到可用模型",
        });
      }
    } catch (error: any) {
      toast({
        title: "获取失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const getDaysInMonth = (month: string) => {
    const m = parseInt(month);
    if ([1, 3, 5, 7, 8, 10, 12].includes(m)) return 31;
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 29; // Feb
  };

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
                            <SelectItem value="aliyun">阿里云百炼 (Qwen)</SelectItem>
                            <SelectItem value="volcengine">火山引擎 (Doubao)</SelectItem>
                            <SelectItem value="modelscope">ModelScope</SelectItem>
                            <SelectItem value="bigmodel">智谱 BigModel</SelectItem>
                            <SelectItem value="tencent">腾讯云 (Hunyuan)</SelectItem>
                            <SelectItem value="deepseek">DeepSeek</SelectItem>
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
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                             <Input {...field} placeholder="例如: gpt-4-turbo" />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={fetchModels}
                            disabled={isFetchingModels}
                            title="获取模型列表"
                          >
                            {isFetchingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                        </div>
                        {fetchedModels.length > 0 && (
                          <div className="mt-2">
                             <Select onValueChange={field.onChange} value={fetchedModels.includes(field.value) ? field.value : undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="从列表中选择模型..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fetchedModels.map((model) => (
                                  <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
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
                          <FormDescription>开启后将自动生成上周周报</FormDescription>
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
                  {form.watch("schedule_weekly") && (
                    <div className="flex gap-4 pl-4">
                       <FormField
                        control={form.control}
                        name="schedule_weekly_day"
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>执行时间 (周几)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择周几" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">周一</SelectItem>
                                <SelectItem value="2">周二</SelectItem>
                                <SelectItem value="3">周三</SelectItem>
                                <SelectItem value="4">周四</SelectItem>
                                <SelectItem value="5">周五</SelectItem>
                                <SelectItem value="6">周六</SelectItem>
                                <SelectItem value="0">周日</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule_weekly_time"
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>执行时间 (HH:mm)</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="schedule_monthly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">自动生成月报</FormLabel>
                          <FormDescription>开启后将自动生成上月月报</FormDescription>
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
                  {form.watch("schedule_monthly") && (
                    <div className="flex gap-4 pl-4">
                       <FormField
                        control={form.control}
                        name="schedule_monthly_day"
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>执行日期 (每月)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择日期" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                  <SelectItem key={day} value={day.toString()}>{day}日</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule_monthly_time"
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>执行时间 (HH:mm)</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="schedule_yearly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">自动生成年报</FormLabel>
                          <FormDescription>开启后将自动生成上一年年报</FormDescription>
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
                  {form.watch("schedule_yearly") && (
                    <div className="flex gap-4 pl-4">
                       <FormField
                        control={form.control}
                        name="schedule_yearly_month"
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel>执行月份</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择月份" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1月</SelectItem>
                                <SelectItem value="2">2月</SelectItem>
                                <SelectItem value="3">3月</SelectItem>
                                <SelectItem value="12">12月</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="schedule_yearly_day"
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel>执行日期</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择日期" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: getDaysInMonth(form.watch("schedule_yearly_month")) }, (_, i) => i + 1).map((day) => (
                                  <SelectItem key={day} value={day.toString()}>{day}日</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule_yearly_time"
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormLabel>执行时间 (HH:mm)</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
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
