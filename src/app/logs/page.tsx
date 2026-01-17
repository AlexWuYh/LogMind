"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress"; // Need to check if exists, or build one
import { Plus, Edit, ChevronDown, ChevronUp, Calendar as CalendarIcon, List as ListIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type DailyWorkItem = {
  id: string;
  content: string;
  project?: string;
  priority?: string;
  progress: number;
};

type DailyLog = {
  id: string;
  date: string;
  summary: string;
  aiSummary?: string;
  progress: number;
  priority: string;
  items: DailyWorkItem[];
};

export default function LogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/daily-logs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
          setFilteredLogs(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(log => 
      log.date.includes(query) ||
      log.project?.toLowerCase().includes(query) ||
      log.summary?.toLowerCase().includes(query) ||
      log.aiSummary?.toLowerCase().includes(query) ||
      log.items.some(item => 
        item.content.toLowerCase().includes(query) || 
        item.project?.toLowerCase().includes(query)
      )
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const today = format(new Date(), "yyyy-MM-dd");
  const datesWithLogs = logs.map(log => parseISO(log.date));

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      router.push(`/logs/${dateStr}`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (loading) return <div className="p-10 text-center">加载中...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">工作日志</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索日志..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1">
             <Button 
               variant={viewMode === "list" ? "secondary" : "ghost"} 
               size="sm" 
               onClick={() => setViewMode("list")}
               className="gap-2"
             >
               <ListIcon className="h-4 w-4" /> 列表
             </Button>
             <Button 
               variant={viewMode === "calendar" ? "secondary" : "ghost"} 
               size="sm" 
               onClick={() => setViewMode("calendar")}
               className="gap-2"
             >
               <CalendarIcon className="h-4 w-4" /> 日历
             </Button>
          </div>
          <Link href={`/logs/${today}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              记录今日
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Calendar View (Always visible on large screens if in calendar mode, or just side widget) 
            Request: "Add calendar view... visually see which day has logs... click to jump"
        */}
        {viewMode === "calendar" && (
           <div className="lg:col-span-12 flex justify-center">
             <Card className="w-full max-w-3xl">
               <CardContent className="p-6">
                 <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border w-full flex justify-center"
                    modifiers={{
                      booked: datesWithLogs
                    }}
                    modifiersStyles={{
                      booked: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                    }}
                  />
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    点击日期查看或编辑当日日志
                  </div>
               </CardContent>
             </Card>
           </div>
        )}

        {viewMode === "list" && (
          <>
            {/* Side Calendar Widget (Optional, maybe hidden on mobile) */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <Card>
                 <CardHeader><CardTitle className="text-sm">日历导航</CardTitle></CardHeader>
                 <CardContent>
                   <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border shadow-sm"
                      modifiers={{
                        booked: datesWithLogs
                      }}
                      modifiersClassNames={{
                        booked: "bg-primary/10 text-primary font-bold"
                      }}
                    />
                 </CardContent>
              </Card>
            </div>

            {/* Log List */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">
                    {searchQuery ? "未找到匹配的日志" : "暂无日志记录，开始记录你的第一天工作吧！"}
                  </p>
                  {!searchQuery && (
                    <Link href={`/logs/${today}`} className="mt-4 inline-block">
                      <Button variant="outline">立即记录</Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const displayProgress = log.items && log.items.length > 0 
                    ? Math.round(log.items.reduce((acc, item) => acc + (item.progress || 0), 0) / log.items.length)
                    : 0;
                    
                  return (
                  <Card key={log.id} className={`transition-all duration-200 ${expandedLogId === log.id ? 'ring-2 ring-primary/20' : 'hover:shadow-md'}`}>
                    <div 
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      {/* Date Box */}
                      <div className="flex-shrink-0 w-16 h-16 bg-primary/5 rounded-lg flex flex-col items-center justify-center border border-primary/10">
                        <span className="text-xs text-muted-foreground font-medium uppercase">{format(parseISO(log.date), "MMM", { locale: zhCN })}</span>
                        <span className="text-xl font-bold text-primary">{format(parseISO(log.date), "dd")}</span>
                      </div>

                      {/* Content Preview */}
                      <div className="flex-1 min-w-0 space-y-2">
                         <div className="flex items-center gap-2">
                           <h3 className="font-semibold text-foreground truncate">
                             {log.project ? log.project : (log.items?.[0]?.project || "日常工作")}
                           </h3>
                           {log.priority && (
                             <Badge variant="outline" className="text-xs scale-90 origin-left">
                               {log.priority}
                             </Badge>
                           )}
                         </div>
                         
                         {/* Visual Progress Bar */}
                         <div className="flex items-center gap-3 w-full max-w-md">
                           <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-primary rounded-full" 
                               style={{ width: `${displayProgress}%` }} 
                             />
                           </div>
                           <Badge 
                             variant={displayProgress === 100 ? "default" : displayProgress === 0 ? "destructive" : "secondary"} 
                             className={cn(
                               "text-[10px] h-5 px-1.5 font-normal flex-shrink-0",
                               displayProgress === 100 && "bg-green-600 hover:bg-green-700",
                               displayProgress === 0 && "bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/40",
                               displayProgress > 0 && displayProgress < 100 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                             )}
                           >
                             {displayProgress}%
                           </Badge>
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-auto">
                        <Link href={`/logs/${log.date}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="h-3.5 w-3.5 mr-1.5" /> 编辑
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {expandedLogId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedLogId === log.id && (
                      <div className="border-t border-border/50 bg-muted/10 p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="grid gap-6 md:grid-cols-2">
                           <div>
                             <h4 className="text-sm font-medium mb-3 text-muted-foreground">工作事项</h4>
                             {(() => {
                               const groupedItems = log.items.reduce((acc, item) => {
                                 const project = item.project || "其他/未分类";
                                 if (!acc[project]) acc[project] = [];
                                 acc[project].push(item);
                                 return acc;
                               }, {} as Record<string, DailyWorkItem[]>);

                               return Object.entries(groupedItems).map(([project, items]) => (
                                 <div key={project} className="mb-5 last:mb-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="h-px flex-1 bg-border/60"></div>
                                      <h5 className="text-xs font-bold text-primary/80 uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                        {project}
                                      </h5>
                                      <div className="h-px flex-1 bg-border/60"></div>
                                    </div>
                                    <ul className="space-y-3">
                                      {items.map((item, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-3 bg-card/50 p-2.5 rounded-md border border-border/40 hover:border-primary/20 transition-colors">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                               <span className="font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">{item.content}</span>
                                               <Badge 
                                                 variant={item.progress === 100 ? "default" : item.progress === 0 ? "destructive" : "secondary"} 
                                                 className={cn(
                                                   "text-[10px] h-5 px-1.5 font-normal flex-shrink-0",
                                                   item.progress === 100 && "bg-green-600 hover:bg-green-700",
                                                   item.progress === 0 && "bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/40",
                                                   item.progress > 0 && item.progress < 100 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                 )}
                                               >
                                                 {item.progress}%
                                               </Badge>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                 </div>
                               ));
                             })()}
                           </div>
                           
                           {log.aiSummary && (
                             <div>
                               <h4 className="text-sm font-medium mb-3 text-muted-foreground">AI 总结</h4>
                               <div className="text-sm text-muted-foreground bg-background border rounded-lg p-3">
                                 {log.aiSummary}
                               </div>
                             </div>
                           )}

                           {log.summary && !log.aiSummary && (
                              <div>
                               <h4 className="text-sm font-medium mb-3 text-muted-foreground">今日总结</h4>
                               <div className="text-sm text-muted-foreground bg-background border rounded-lg p-3">
                                 {log.summary}
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
