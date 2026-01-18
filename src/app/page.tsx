"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, BarChart, FileText, CheckCircle2, Clock, ArrowRight, Sparkles, TrendingUp, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { WeatherWidget } from "@/components/ui/weather-widget";
import { cn } from "@/lib/utils";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN });
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "早安" : hours < 18 ? "午安" : "晚上好";
  const userName = session?.user?.name || "User";

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[500px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium animate-pulse">正在加载工作台...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 lg:p-8 space-y-8 max-w-[1600px] animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {greeting}, {userName}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-2 text-sm bg-accent/30 px-3 py-1 rounded-full border border-border/50">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayDisplay}
            </span>
            <WeatherWidget />
          </div>
        </div>
        <div className="flex gap-3">
           <Link href={`/logs/${today}`}>
              <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <Sparkles className="mr-2 h-4 w-4" />
                今日记事
              </Button>
           </Link>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* KPI Cards - Row 1 */}
        <BentoCard className="col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-900/10">
           <div className="flex flex-col justify-between h-full">
             <div className="flex justify-between items-start">
               <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                 <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
               </div>
               <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80 bg-blue-100/30 px-2 py-0.5 rounded-full">Total Logs</span>
             </div>
             <div>
               <div className="text-3xl font-bold text-foreground">{data.totalLogs}</div>
               <p className="text-xs text-muted-foreground mt-1">累计工作日志</p>
             </div>
           </div>
        </BentoCard>

        <BentoCard className="col-span-1 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-900/10">
           <div className="flex flex-col justify-between h-full">
             <div className="flex justify-between items-start">
               <div className="p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg">
                 <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
               </div>
               <span className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80 bg-amber-100/30 px-2 py-0.5 rounded-full">This Week</span>
             </div>
             <div>
               <div className="text-3xl font-bold text-foreground">{data.weekCount} <span className="text-sm font-normal text-muted-foreground">天</span></div>
               <p className="text-xs text-muted-foreground mt-1">本周记录天数</p>
             </div>
           </div>
        </BentoCard>

        <BentoCard className="col-span-1 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-900/10">
           <div className="flex flex-col justify-between h-full">
             <div className="flex justify-between items-start">
               <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg">
                 <BarChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
               </div>
               <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 bg-emerald-100/30 px-2 py-0.5 rounded-full">Reports</span>
             </div>
             <div>
               <div className="text-3xl font-bold text-foreground">{data.reportCount}</div>
               <p className="text-xs text-muted-foreground mt-1">已生成报告总数</p>
             </div>
           </div>
        </BentoCard>

        <BentoCard className="col-span-1 flex flex-col justify-center items-center text-center p-6 border-dashed border-2 bg-transparent hover:bg-accent/5 transition-colors cursor-pointer group">
           <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <Sparkles className="h-6 w-6 text-muted-foreground" />
           </div>
           <h3 className="font-semibold text-foreground">快速生成</h3>
           <p className="text-xs text-muted-foreground mt-1 px-4">一键生成本周工作周报</p>
        </BentoCard>

        {/* Today's Focus - Large Card */}
        <BentoCard className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <CheckCircle2 className="h-32 w-32" />
           </div>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-full ${data.todayLogged ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
               今日状态
             </CardTitle>
             <CardDescription>{data.todayLogged ? "已完成今日记录" : "尚未记录今日工作"}</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6 relative z-10">
              <div className="flex flex-col gap-4">
                 <div className="text-4xl font-bold tracking-tight">
                   {data.todayLogged ? (
                     <span className="text-green-600 dark:text-green-400">Completed</span>
                   ) : (
                     <span className="text-amber-600 dark:text-amber-400">Pending...</span>
                   )}
                 </div>
                 <p className="text-muted-foreground max-w-md">
                   {data.todayLogged 
                     ? "今日工作内容已记录。系统将根据您的记录自动整理周报素材。" 
                     : "记录今日工作内容，帮助 AI 更好地了解您的工作进度，生成更准确的周报。"}
                 </p>
              </div>
              
              <div className="pt-4">
                {data.todayLogged && (
                   <div className="space-y-2 mb-6">
                     <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                       <span>Progress</span>
                       <span>{data.todayProgress}%</span>
                     </div>
                     <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full" style={{ width: `${data.todayProgress}%` }} />
                     </div>
                   </div>
                )}
                
                <Link href={`/logs/${today}`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {data.todayLogged ? "编辑日志" : "开始记录"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
           </CardContent>
        </BentoCard>

        {/* Recent Activity List - Tall Card */}
        <BentoCard className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 flex flex-col">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle>最近活动</CardTitle>
             <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
           </CardHeader>
           <CardContent className="flex-1 overflow-auto pr-2">
             <div className="space-y-1">
               {data.recentLogs.map((log: any, i: number) => (
                 <Link key={log.id} href={`/logs/${log.date}`} className="group flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                   <div className="flex flex-col items-center gap-1 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      {i < data.recentLogs.length - 1 && <div className="w-px h-full bg-border/50 min-h-[20px]" />}
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {format(new Date(log.date), "MM月dd日")}
                        </span>
                        {/* <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Work</span> */}
                      </div>
                      <p className="text-sm font-medium text-foreground/80 line-clamp-1">{log.project || "未指定项目"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {log.summary || "无摘要内容..."}
                      </p>
                   </div>
                 </Link>
               ))}
               {data.recentLogs.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 opacity-50">
                   <FileText className="h-8 w-8 mb-2" />
                   <p className="text-sm">暂无活动记录</p>
                 </div>
               )}
             </div>
           </CardContent>
        </BentoCard>

        {/* Report Stats - Bottom Row - Full Width */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <BentoCard className="flex items-center justify-between p-6">
             <div>
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Reports</p>
               <div className="text-2xl font-bold mt-1">{data.reportStats?.weekly || 0}</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
               <BarChart className="h-5 w-5 text-primary" />
             </div>
          </BentoCard>
          
          <BentoCard className="flex items-center justify-between p-6">
             <div>
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Reports</p>
               <div className="text-2xl font-bold mt-1">{data.reportStats?.monthly || 0}</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
               <BarChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
             </div>
          </BentoCard>

          <BentoCard className="flex items-center justify-between p-6">
             <div>
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yearly Reports</p>
               <div className="text-2xl font-bold mt-1">{data.reportStats?.yearly || 0}</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
               <BarChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
             </div>
          </BentoCard>
        </div>

      </div>
    </div>
  );
}

function BentoCard({ children, className, ...props }: any) {
  return (
    <Card className={cn("border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm", className)} {...props}>
      {children}
    </Card>
  );
}
