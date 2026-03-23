import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useEvaluationStore } from "@/store/use-evaluation-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, ArrowLeft, Trophy, Users, Filter, 
  ChevronDown, ChevronRight, MessageSquare, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmployeeScore } from "@workspace/api-client-react";

export default function Results() {
  const [, setLocation] = useLocation();
  const { result, clearResult } = useEvaluationStore();

  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [showTop10, setShowTop10] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Redirect if no result
  if (!result) {
    setLocation("/");
    return null;
  }

  const teams = useMemo(() => {
    const uniqueTeams = new Set(result.employees.map(e => e.team));
    return ["all", ...Array.from(uniqueTeams).filter(Boolean).sort()];
  }, [result.employees]);

  const filteredEmployees = useMemo(() => {
    let list = [...result.employees];
    
    // Team filter
    if (selectedTeam !== "all") {
      list = list.filter(e => e.team === selectedTeam);
    }
    
    // Top 10% filter
    if (showTop10) {
      list.sort((a, b) => b.score - a.score);
      const topCount = Math.max(1, Math.ceil(list.length * 0.1));
      list = list.slice(0, topCount);
    } else {
      // Default sort by team then score
      list.sort((a, b) => {
        if (a.team !== b.team) return a.team.localeCompare(b.team);
        return b.score - a.score;
      });
    }
    
    return list;
  }, [result.employees, selectedTeam, showTop10]);

  const toggleRow = (name: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedRows(newSet);
  };

  const handleRestart = () => {
    clearResult();
    setLocation("/");
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header - Hidden in Print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print-hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleRestart} className="hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">
              {result.evaluationType === 'midyear' ? '상반기 (Mid-year)' : '연말 (Year-end)'} 평가 리포트
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={printReport} className="gap-2">
              <Printer className="w-4 h-4" />
              PDF 저장 / 인쇄
            </Button>
            <Button onClick={handleRestart}>
              새로운 평가 시작
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Print Only Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900 border-b-2 border-slate-900 pb-4">
            HR 목표 달성 종합 평가 리포트
          </h1>
          <p className="text-slate-500 mt-2">
            평가 구분: {result.evaluationType === 'midyear' ? 'Mid-year' : 'Year-end'} | 
            작성일: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* HR Summary Card */}
        <Card className="border-none shadow-lg shadow-primary/5 bg-gradient-to-br from-white to-primary/5 print-shadow-none">
          <CardContent className="p-8">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-xl shrink-0 mt-1">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">종합 HR 코멘트 (AI 분석)</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters - Hidden in Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Filter className="w-4 h-4" />
            결과 필터링
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="all">모든 팀 보기</option>
              {teams.filter(t => t !== 'all').map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowTop10(!showTop10)}
              className={cn(
                "flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold transition-all",
                showTop10 
                  ? "bg-amber-100 border-amber-200 text-amber-700 shadow-inner" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trophy className={cn("w-4 h-4", showTop10 ? "text-amber-600" : "text-slate-400")} />
              상위 10% {showTop10 ? '해제' : '보기'}
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print-shadow-none print-break-inside-avoid">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              직원별 상세 평가 결과
              <Badge variant="secondary" className="ml-2 font-mono">
                {filteredEmployees.length}명
              </Badge>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-6 py-3">이름</th>
                  <th className="px-6 py-3">팀</th>
                  <th className="px-6 py-3">종합 점수</th>
                  <th className="px-6 py-3 max-w-md">주요 피드백</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp, idx) => {
                  const isExpanded = expandedRows.has(emp.name);
                  
                  return (
                    <React.Fragment key={emp.name + idx}>
                      <tr 
                        onClick={() => toggleRow(emp.name)}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isExpanded ? "bg-primary/5" : "hover:bg-slate-50/80"
                        )}
                      >
                        <td className="px-4 py-4 text-slate-400 text-center print-hidden">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{emp.name}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-slate-600 bg-white">
                            {emp.team}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <ScoreBadge score={emp.score} />
                        </td>
                        <td className="px-6 py-4 max-w-md truncate text-slate-600 pr-8">
                          {emp.feedback}
                        </td>
                      </tr>
                      
                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-slate-50/50 border-b-2 border-slate-200"
                          >
                            <td colSpan={5} className="p-0">
                              <div className="p-6 pl-14 pr-8 space-y-6">
                                
                                {/* HR Comment */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3">
                                  <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">HR 관점 코멘트</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{emp.hrComment}</p>
                                  </div>
                                </div>

                                {/* Goal Breakdown */}
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-primary pl-2">세부 목표별 평가</h4>
                                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                        <tr>
                                          <th className="px-4 py-2 font-medium">목표 항목</th>
                                          <th className="px-4 py-2 font-medium w-24">점수</th>
                                          <th className="px-4 py-2 font-medium">상세 코멘트</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {emp.goals.map((goal, gidx) => (
                                          <tr key={gidx} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{goal.goalTitle}</td>
                                            <td className="px-4 py-3">
                                              <Badge variant="secondary" className="font-mono">{goal.score} / 5</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{goal.comment}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
                
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      조건에 맞는 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
