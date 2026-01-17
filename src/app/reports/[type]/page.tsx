"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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

  // Calculate period range
  const getRange = () => {
    if (type === "WEEKLY") {
      return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    } else if (type === "MONTHLY") {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    } else {
      return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    }
  };

  const { start, end } = getRange();
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const loadReports = () => {
    setLoading(true);
    fetch(`/api/reports?type=${type}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setReports(data);
           setFilteredReports(data);
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
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(report => 
      report.periodStart.includes(query) ||
      report.periodEnd.includes(query) ||
      report.content.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

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

  const navigateDate = (dir: 1 | -1) => {
    if (type === "WEEKLY") setCurrentDate(d => addWeeks(d, dir));
    else if (type === "MONTHLY") setCurrentDate(d => addMonths(d, dir));
    else setCurrentDate(d => addYears(d, dir));
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{typeLabel()}</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`搜索${typeLabel()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>生成报告</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
             <span className="font-medium min-w-[200px] text-center">{periodLabel()}</span>
             <Button variant="outline" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="h-4 w-4" /></Button>
           </div>
           <Button onClick={handleGenerate} disabled={generating}>
             {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
             AI 生成报告
           </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">历史报告</h2>
        {loading ? <div>加载中...</div> : (
          <div className="grid gap-4">
            {filteredReports.map(report => (
              <Card key={report.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {typeLabel()} ({report.periodStart} 至 {report.periodEnd})
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">生成时间: {new Date(report.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                   <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                     {/* Try to parse JSON to display nicely, fallback to string */}
                     {(() => {
                       try {
                         const content = JSON.parse(report.content);
                         return (
                           <div className="font-sans space-y-4">
                             <div>
                               <h3 className="font-bold">总结</h3>
                               <p>{content.summary}</p>
                             </div>
                             <div>
                               <h3 className="font-bold">主要成就</h3>
                               <ul className="list-disc pl-5">
                                 {content.key_achievements?.map((a: string, i: number) => <li key={i}>{a}</li>)}
                               </ul>
                             </div>
                             <div>
                               <h3 className="font-bold">下一步计划</h3>
                               <ul className="list-disc pl-5">
                                 {content.next_plan?.map((a: string, i: number) => <li key={i}>{a}</li>)}
                               </ul>
                             </div>
                           </div>
                         );
                       } catch {
                         return report.content;
                       }
                     })()}
                   </div>
                </CardContent>
              </Card>
            ))}
            {filteredReports.length === 0 && <div className="text-muted-foreground">{searchQuery ? "未找到匹配的报告。" : "暂无报告。"}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
