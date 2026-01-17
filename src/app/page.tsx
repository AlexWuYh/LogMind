"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, BarChart, FileText, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { WeatherWidget } from "@/components/ui/weather-widget";

export default function DashboardPage() {
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

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[500px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium animate-pulse">正在加载工作台...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-8 space-y-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            工作台
          </h1>
          <div className="mt-2 hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
             <span className="opacity-70">Log your work.</span>
             <span className="w-1 h-1 rounded-full bg-primary/40" />
             <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent font-semibold">
               Let Logmind think.
             </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">{todayDisplay}</p>
            <WeatherWidget />
          </div>
        </div>
        <div className="flex gap-3">
           {/* Future Actions */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="本周记录" 
          value={`${data.weekCount} 天`} 
          icon={CalendarDays} 
          description="本周已记录天数"
          trend="+1" // Mock trend
        />
        <KPICard 
          title="本月记录" 
          value={`${data.monthCount} 天`} 
          icon={CalendarDays} 
          description="本月已记录天数"
        />
        <KPICard 
          title="日志总数" 
          value={data.totalLogs} 
          icon={FileText} 
          description="累计工作日志"
        />
        <KPICard 
          title="已生成报告" 
          value={data.reportCount} 
          icon={BarChart} 
          description="周报/月报/年报"
        />
      </div>

      {/* Report Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">周报统计</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportStats?.weekly || 0}</div>
            <p className="text-xs text-muted-foreground">已生成的周报数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月报统计</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportStats?.monthly || 0}</div>
            <p className="text-xs text-muted-foreground">已生成的月报数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年报统计</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportStats?.yearly || 0}</div>
            <p className="text-xs text-muted-foreground">已生成的年报数量</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-12">
        {/* Today's Status & Progress */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                今日状态
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-accent/20 rounded-xl border border-accent/50">
                  <div className="flex items-center gap-4">
                     <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm ${data.todayLogged ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                       {data.todayLogged ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">{data.todayLogged ? "今日已记录" : "今日未记录"}</h3>
                       <p className="text-sm text-muted-foreground">
                         {data.todayLogged ? "工作进度已更新，继续保持！" : "记录今天的点滴进展，让工作更有条理。"}
                       </p>
                     </div>
                  </div>
                  <Link href={`/logs/${today}`}>
                    <Button size="lg" className={data.todayLogged ? "bg-card text-foreground border border-border hover:bg-accent" : "shadow-lg shadow-primary/20"}>
                      {data.todayLogged ? "编辑日志" : "立即记录"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
               </div>
               
               {data.todayLogged && (
                 <div className="mt-8 space-y-3">
                   <div className="flex justify-between text-sm font-medium">
                     <span>今日完成度</span>
                     <span className="text-primary">{data.todayProgress}%</span>
                   </div>
                   <div className="h-3 bg-secondary rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                       style={{ width: `${data.todayProgress}%` }} 
                     />
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-5 lg:col-span-4">
          <Card className="h-full border-border shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">最近活动</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6">
                {data.recentLogs.map((log: any, i: number) => (
                  <Link key={log.id} href={`/logs/${log.date}`} className="group block relative pl-6 border-l-2 border-muted hover:border-primary transition-colors">
                    <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-background border-2 border-muted group-hover:border-primary transition-colors" />
                    <div className="flex justify-between items-start">
                       <span className="text-sm font-medium group-hover:text-primary transition-colors">{log.date}</span>
                       {/* <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">已完成</span> */}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{log.project || "无项目"}</p>
                    {log.summary && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{log.summary}</p>}
                  </Link>
                ))}
                {data.recentLogs.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">暂无活动</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground/70" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend && <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{trend}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
