"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Plus, Save, Sparkles, BrainCircuit, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

const workItemSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1, "内容不能为空"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  progress: z.coerce.number().min(0).max(100).default(0),
  project: z.string().min(1, "项目不能为空"), // Required as per request
});

const formSchema = z.object({
  date: z.string(),
  // project: z.string().optional(), // Removed from top level, moved to items
  // priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), // Removed
  // progress: z.coerce.number().min(0).max(100).default(0), // Removed
  // summary: z.string().optional(), // Replaced by AI Summary read-only
  aiSummary: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  items: z.array(workItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function LogEditorPage() {
  const params = useParams();
  const date = params.date as string;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      date: date,
      items: [{ content: "", progress: 0, priority: "MEDIUM", project: "" }],
      aiSummary: "",
      tomorrowPlan: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (date) {
      fetch(`/api/daily-logs/${date}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isNew) {
            // New log
          } else {
            // Existing log
            form.reset({
              date: data.date,
              aiSummary: data.aiSummary || "",
              tomorrowPlan: data.tomorrowPlan || "",
              items: data.items.length > 0 ? data.items.map((item: any) => ({
                ...item,
                project: item.project || "",
                content: item.content || "",
                priority: item.priority || "MEDIUM",
              })) : [{ content: "", progress: 0, priority: "MEDIUM", project: "" }],
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: "错误",
            description: "加载日志失败",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [date, form, toast]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({
        title: "成功",
        description: "日报已保存",
      });
      router.refresh();
      // Optional: Delay redirect to allow user to see the success message
      setTimeout(() => {
        router.push("/logs");
      }, 500);
    } catch (error) {
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" onClick={() => router.push('/logs')} className="-ml-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" />
                返回列表
             </Button>
          </div>
          <h1 className="text-3xl font-bold">工作日志</h1>
          <p className="text-muted-foreground">{date}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.push('/logs')} disabled={saving}>
              取消
           </Button>
           <Button onClick={form.handleSubmit(onSubmit)} disabled={saving} size="lg">
             {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             <Save className="mr-2 h-4 w-4" />
             保存并返回
           </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Work Items (Main Focus) */}
            <div className="lg:col-span-2 space-y-8">
               <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">今日工作事项</CardTitle>
                    <p className="text-sm text-muted-foreground">记录今天完成的核心任务与进展</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ content: "", progress: 0, priority: "MEDIUM", project: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> 添加事项
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="group relative bg-accent/10 rounded-xl p-4 border border-border/50 hover:border-primary/20 transition-all">
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Project & Priority Row */}
                        <div className="flex flex-col sm:flex-row gap-4">
                           <FormField
                            control={form.control}
                            name={`items.${index}.project`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                 <FormLabel className="text-xs text-muted-foreground">所属项目 <span className="text-destructive">*</span></FormLabel>
                                 <FormControl><Input {...field} placeholder="例如: LogMind开发" className="bg-background" /></FormControl>
                                 <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.priority`}
                            render={({ field }) => (
                              <FormItem className="w-full sm:w-32">
                                 <FormLabel className="text-xs text-muted-foreground">优先级</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-background"><SelectValue placeholder="优先级" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="LOW">低</SelectItem>
                                      <SelectItem value="MEDIUM">中</SelectItem>
                                      <SelectItem value="HIGH">高</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Content */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.content`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">工作内容 <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                {/* Simple auto-resize via CSS or min-h */}
                                <Textarea 
                                  {...field} 
                                  placeholder="详细描述工作内容..." 
                                  className="min-h-[80px] bg-background resize-y" 
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${target.scrollHeight}px`;
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Progress */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.progress`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between mb-2">
                                <FormLabel className="text-xs text-muted-foreground">完成进度</FormLabel>
                                <span className="text-xs font-medium text-primary">{field.value}%</span>
                              </div>
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    defaultValue={[field.value]}
                                    max={100}
                                    step={5}
                                    className="flex-1"
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-accent/5 rounded-lg border border-dashed">
                      点击右上角添加今日工作事项
                    </div>
                  )}
                </CardContent>
               </Card>

               <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">明日计划</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tomorrowPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="规划明天的工作重点..." 
                              className="min-h-[120px] resize-none" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
               </Card>
            </div>

            {/* Right Column: AI Summary */}
            <div className="space-y-6">
              <Card className="border-border shadow-sm bg-gradient-to-br from-card to-primary/5 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <Sparkles className="h-5 w-5" />
                    AI 智能总结
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">每日凌晨 01:00 自动生成</p>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[300px] p-4 rounded-xl bg-background/50 border border-primary/10 backdrop-blur-sm">
                    {form.watch("aiSummary") ? (
                      <div className="prose prose-sm dark:prose-invert">
                        <p className="whitespace-pre-wrap">{form.watch("aiSummary")}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-10">
                        <BrainCircuit className="h-10 w-10 opacity-20" />
                        <p className="text-sm text-center max-w-[200px]">
                          智能总结将在次日凌晨生成，帮您归纳全天工作亮点。
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
