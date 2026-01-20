"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, parseISO, isSameMonth, isSameYear, isSameWeek, getYear } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, FileText, Search, Copy, Check, Trash2, Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const type = (params.type as string).toUpperCase(); // WEEKLY, MONTHLY, YEARLY
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  
  // Action states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined);
  const [customYear, setCustomYear] = useState<string>("");

  // Calculate period range
  const getRange = (date: Date) => {
    if (type === "WEEKLY") {
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    } else if (type === "MONTHLY") {
      return { start: startOfMonth(date), end: endOfMonth(date) };
    } else {
      return { start: startOfYear(date), end: endOfYear(date) };
    }
  };

  const { start, end } = getRange(currentDate);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const loadReports = () => {
    setLoading(true);
    fetch(`/api/reports?type=${type}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           // Sort by date desc
           const sorted = data.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
           setReports(sorted);
           setFilteredReports(sorted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReports();
  }, [type]);

  useEffect(() => {
    let filtered = reports;

    // 1. Date Filter
    if (filterDate) {
      filtered = filtered.filter(report => {
        const reportDate = parseISO(report.periodStart); // periodStart is usually YYYY-MM-DD
        if (type === "WEEKLY") {
          return isSameWeek(reportDate, filterDate, { weekStartsOn: 1 });
        } else if (type === "MONTHLY") {
          return isSameMonth(reportDate, filterDate);
        } else {
          // YEARLY
          return isSameYear(reportDate, filterDate);
        }
      });
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.periodStart.includes(query) ||
        report.periodEnd.includes(query) ||
        report.content.toLowerCase().includes(query)
      );
    }
    
    setFilteredReports(filtered);
  }, [searchQuery, filterDate, reports, type]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          startDate: startStr,
          endDate: endStr,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "生成失败");
      }

      toast({ title: "报告已生成", description: "您的报告已准备就绪" });
      loadReports();
    } catch (error: any) {
      toast({ 
        title: "错误", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      
      setReports(prev => prev.filter(r => r.id !== deleteId));
      setFilteredReports(prev => prev.filter(r => r.id !== deleteId));
      toast({ title: "已删除", description: "报告已成功删除" });
    } catch (error) {
      toast({ title: "错误", description: "无法删除报告", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleCopy = (content: string, id: string) => {
    // Format JSON content nicely for clipboard if it's JSON
    let textToCopy = content;
    try {
      const json = JSON.parse(content);
      const parts = [];
      if (json.summary) parts.push(`【总结】\n${json.summary}`);
      if (json.key_achievements?.length) parts.push(`【主要成就】\n${json.key_achievements.map((i: string) => `- ${i}`).join('\n')}`);
      if (json.project_breakdown?.length) parts.push(`【项目进展】\n${json.project_breakdown.map((p: any) => `### ${p.project}\n${p.summary}`).join('\n')}`);
      if (json.next_plan?.length) parts.push(`【下一步计划】\n${json.next_plan.map((i: string) => `- ${i}`).join('\n')}`);
      
      if (parts.length > 0) textToCopy = parts.join('\n\n');
    } catch (e) {
      // Fallback to raw content
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    toast({ title: "已复制", description: "报告内容已复制到剪贴板" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navigateDate = (dir: 1 | -1) => {
    if (type === "WEEKLY") setCurrentDate(d => addWeeks(d, dir));
    else if (type === "MONTHLY") setCurrentDate(d => addMonths(d, dir));
    else setCurrentDate(d => addYears(d, dir));
  };

  const setSpecificDate = (date: Date | undefined) => {
    if (date) setCurrentDate(date);
  };

  const periodLabel = () => {
    if (type === "WEEKLY") return `${format(start, "MM月dd日", { locale: zhCN })} - ${format(end, "MM月dd日, yyyy", { locale: zhCN })}`;
    if (type === "MONTHLY") return format(start, "yyyy年 MMMM", { locale: zhCN });
    return format(start, "yyyy年", { locale: zhCN });
  };

  const typeLabel = () => {
      if (type === "WEEKLY") return "周报";
      if (type === "MONTHLY") return "月报";
      if (type === "YEARLY") return "年报";
      return "报告";
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{typeLabel()}管理</h1>
          <p className="text-muted-foreground mt-1">自动生成、管理和导出您的工作汇报</p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filter Popover */}
          <Popover>
             <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={cn(filterDate && "text-primary border-primary bg-primary/5")}
                  title="筛选日期"
                >
                  <Filter className="h-4 w-4" />
                </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">筛选{typeLabel()}</h4>
                    {filterDate && (
                      <Button variant="ghost" size="sm" onClick={() => setFilterDate(undefined)} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                        清除
                      </Button>
                    )}
                  </div>
                  
                  {type === "YEARLY" ? (
                    <div className="space-y-4 w-[240px]">
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - 4 + i).map(year => (
                          <Button
                            key={year}
                            variant={filterDate && getYear(filterDate) === year ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterDate(new Date(year, 0, 1))}
                          >
                            {year}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                         <Input 
                            placeholder="自定义年份" 
                            className="h-8 text-sm" 
                            value={customYear}
                            onChange={(e) => setCustomYear(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const year = parseInt(customYear);
                                if (!isNaN(year) && year > 1900 && year < 2100) {
                                  setFilterDate(new Date(year, 0, 1));
                                }
                              }
                            }}
                         />
                         <Button 
                           size="sm" 
                           variant="outline"
                           className="h-8"
                           onClick={() => {
                              const year = parseInt(customYear);
                              if (!isNaN(year) && year > 1900 && year < 2100) {
                                setFilterDate(new Date(year, 0, 1));
                              }
                           }}
                         >
                           确认
                         </Button>
                      </div>
                    </div>
                  ) : type === "MONTHLY" ? (
                     <div className="w-[240px] space-y-4">
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="icon" onClick={() => setFilterDate(d => addYears(d || new Date(), -1))}>
                             <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{format(filterDate || new Date(), "yyyy年")}</span>
                          <Button variant="ghost" size="icon" onClick={() => setFilterDate(d => addYears(d || new Date(), 1))}>
                             <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           {Array.from({ length: 12 }, (_, i) => i).map(month => {
                             const currentYear = filterDate ? getYear(filterDate) : new Date().getFullYear();
                             const date = new Date(currentYear, month, 1);
                             const isSelected = filterDate && isSameMonth(date, filterDate);
                             return (
                               <Button
                                 key={month}
                                 variant={isSelected ? "default" : "outline"}
                                 size="sm"
                                 onClick={() => setFilterDate(date)}
                               >
                                 {month + 1}月
                               </Button>
                             );
                           })}
                        </div>
                     </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={(date) => {
                         // Similar to setSpecificDate logic
                         if (date) setFilterDate(date);
                         else setFilterDate(undefined);
                      }}
                      initialFocus
                      locale={zhCN}
                    />
                  )}
                  
                  {filterDate && (
                    <div className="text-xs text-muted-foreground text-center border-t pt-2">
                      已选择: {type === "WEEKLY" ? "所在周" : type === "MONTHLY" ? format(filterDate, "yyyy年MM月") : format(filterDate, "yyyy年")}
                    </div>
                  )}
                </div>
             </PopoverContent>
          </Popover>

          {filterDate && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setFilterDate(undefined)}
               className="text-muted-foreground hover:text-foreground px-2"
               title="清除筛选"
             >
               {type === "WEEKLY" ? (
                  <>
                     {format(startOfWeek(filterDate, { weekStartsOn: 1 }), "MM.dd")} - {format(endOfWeek(filterDate, { weekStartsOn: 1 }), "MM.dd")}
                  </>
               ) : type === "MONTHLY" ? format(filterDate, "yyyy.MM") : format(filterDate, "yyyy")}
               <X className="ml-1 h-3 w-3" />
             </Button>
          )}

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`搜索${typeLabel()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <Card className="border-primary/10 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            生成新报告
          </CardTitle>
          <CardDescription>选择时间段，AI 将自动分析您的日志并生成汇报</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-800/50 p-4 rounded-lg border">
             <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
               <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
               
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !currentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={setSpecificDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

               <Button variant="outline" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="h-4 w-4" /></Button>
             </div>
             
             <div className="flex-1" />
             
             <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
               {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
               立即生成
             </Button>
           </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            历史报告 ({filteredReports.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-6">
            {filteredReports.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                typeLabel={typeLabel()} 
                onDelete={() => setDeleteId(report.id)} 
                onCopy={(content: string) => handleCopy(content, report.id)}
                isCopied={copiedId === report.id}
              />
            ))}
            {filteredReports.length === 0 && (
              <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">暂无{typeLabel()}记录</p>
                {!searchQuery && <p className="text-xs text-muted-foreground mt-1">点击上方生成按钮开始创建</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该报告，无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReportCard({ report, typeLabel, onDelete, onCopy, isCopied }: any) {
  let content = null;
  let rawContent = report.content;
  
  try {
    content = JSON.parse(report.content);
  } catch {
    // ignore
  }

  return (
    <Card className="group overflow-hidden border-l-4 border-l-primary/60 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-primary">
              {typeLabel} ({report.periodStart} ~ {report.periodEnd})
            </CardTitle>
            {/* <Badge variant="outline" className="text-xs font-normal">v1.0</Badge> */}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Generated on {new Date(report.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onCopy(rawContent)} title="复制内容">
            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="删除报告">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
         <div className="space-y-6 text-sm">
           {content ? (
             <>
                {/* Summary Section */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                  <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> 本期总结
                  </h3>
                  <p className="leading-relaxed text-gray-700 dark:text-gray-300">{content.summary}</p>
                </div>

                {/* Key Achievements */}
                {content.key_achievements?.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      🏆 关键产出
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {content.key_achievements.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-muted/30 p-2 rounded">
                          <span className="text-primary font-bold">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Breakdown - Grid Layout */}
                {content.project_breakdown?.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      📂 项目详情
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                       {content.project_breakdown.map((p: any, i: number) => (
                         <div key={i} className="border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                           <h4 className="font-semibold text-primary mb-2">{p.project}</h4>
                           <p className="text-muted-foreground text-xs leading-relaxed">{p.summary}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Next Plan */}
                {content.next_plan?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      📅 下一步计划
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {content.next_plan.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
             </>
           ) : (
             <div className="whitespace-pre-wrap">{rawContent}</div>
           )}
         </div>
      </CardContent>
    </Card>
  );
}
