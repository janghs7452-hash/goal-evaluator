import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useEvaluateGoals } from "@workspace/api-client-react";
import { useEvaluationStore } from "@/store/use-evaluation-store";
import { extractTextFromFile } from "@/lib/file-parser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, FileText, AlertCircle, Sparkles, Loader2, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setResult } = useEvaluationStore();
  const { mutateAsync: evaluate, isPending } = useEvaluateGoals();

  const [evalType, setEvalType] = useState<"midyear" | "yearend">("yearend");
  const [goalFile, setGoalFile] = useState<File | null>(null);
  const [empFile, setEmpFile] = useState<File | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const goalInputRef = useRef<HTMLInputElement>(null);
  const empInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async () => {
    setError(null);
    try {
      let finalGoalText = fallbackText;
      let finalEmpText = "";

      if (goalFile) {
        finalGoalText = await extractTextFromFile(goalFile);
      }
      if (empFile) {
        finalEmpText = await extractTextFromFile(empFile);
      }

      if (!finalGoalText.trim()) {
        setError("평가할 목표(Goal) 데이터가 없습니다. 파일을 업로드하거나 텍스트를 입력해주세요.");
        return;
      }

      const response = await evaluate({
        data: {
          evaluationType: evalType,
          goalContent: finalGoalText,
          employeeList: finalEmpText || undefined,
        }
      });

      setResult(response);
      setLocation("/results");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "평가 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            HR 목표 달성 자동 평가
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            AI가 직원들의 목표 설정 및 달성 내역을 분석하여 객관적인 점수와 맞춤형 HR 피드백을 자동으로 생성합니다.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          {isPending && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold text-slate-900">AI가 문서를 분석 중입니다...</h3>
              <p className="text-slate-500 mt-2">직원 규모에 따라 1~3분 정도 소요될 수 있습니다.</p>
            </div>
          )}

          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8">
            <CardTitle className="text-xl">평가 설정</CardTitle>
            <CardDescription>평가 시점을 선택하고 기준 데이터를 업로드하세요.</CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Evaluation Type */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900">평가 시점</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setEvalType("midyear")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                    evalType === "midyear" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="font-bold text-lg">Mid-year</span>
                  <span className="text-sm opacity-80 mt-1">상반기 (7~8월)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalType("yearend")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                    evalType === "yearend" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="font-bold text-lg">Year-end</span>
                  <span className="text-sm opacity-80 mt-1">연말 종합 평가</span>
                </button>
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Goals File */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 flex justify-between">
                  <span>목표/실적 문서 (필수)</span>
                  <span className="text-xs text-slate-500 font-normal">Excel, CSV, TXT</span>
                </label>
                <input 
                  type="file" 
                  ref={goalInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv, .txt"
                  onChange={(e) => setGoalFile(e.target.files?.[0] || null)}
                />
                
                {goalFile ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileSpreadsheet className="w-8 h-8 text-primary shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">{goalFile.name}</p>
                        <p className="text-xs text-slate-500">{(goalFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setGoalFile(null)} className="p-2 hover:bg-primary/10 rounded-full text-slate-500 hover:text-destructive transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => goalInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all group"
                  >
                    <div className="p-3 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors mb-3">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">파일 업로드</p>
                    <p className="text-xs text-slate-500 mt-1">클릭하여 파일 선택</p>
                  </div>
                )}
              </div>

              {/* Employee List File */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 flex justify-between">
                  <span>직원 명단 (선택)</span>
                  <span className="text-xs text-slate-500 font-normal">팀 매핑용</span>
                </label>
                <input 
                  type="file" 
                  ref={empInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv, .txt"
                  onChange={(e) => setEmpFile(e.target.files?.[0] || null)}
                />
                
                {empFile ? (
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-8 h-8 text-slate-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">{empFile.name}</p>
                        <p className="text-xs text-slate-500">{(empFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setEmpFile(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-destructive transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => empInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group"
                  >
                    <div className="p-3 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors mb-3">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">명단 업로드 (선택)</p>
                    <p className="text-xs text-slate-500 mt-1">없으면 목표 문서에서 추출</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback Text Area */}
            {!goalFile && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-900">
                  직접 텍스트 입력 (파일이 없을 경우)
                </label>
                <textarea 
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  placeholder="여기에 목표 설정 및 실적 내용을 직접 붙여넣으세요..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:-translate-y-0.5"
              onClick={handleProcess}
              disabled={isPending}
            >
              {isPending ? "분석 시작 중..." : "AI 평가 시작하기"}
              {!isPending && <Sparkles className="w-5 h-5 ml-2" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
