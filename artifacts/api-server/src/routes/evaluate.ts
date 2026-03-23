import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { EvaluateGoalsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/evaluate", async (req, res) => {
  const parsed = EvaluateGoalsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request: " + parsed.error.message });
    return;
  }

  const { evaluationType, goalContent, employeeList } = parsed.data;
  const evalLabel = evaluationType === "midyear" ? "미드이어(중간) 평가" : "연말 평가";

  const systemPrompt = `당신은 HR 전문가입니다. 직원들의 골세팅 문서를 분석하여 5점 만점으로 평가하고, 개인별 피드백과 HR 시점의 코멘트를 제공합니다.

평가 기준:
- 5점: 목표를 완벽히 초과 달성
- 4점: 목표를 충분히 달성
- 3점: 목표를 대체로 달성
- 2점: 목표 달성이 부족
- 1점: 목표 달성이 매우 미흡

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON):
{
  "employees": [
    {
      "name": "직원명",
      "team": "팀명",
      "score": 4.2,
      "feedback": "개인 피드백 (2-3문장, 한국어)",
      "hrComment": "HR 시점 코멘트 (1-2문장, 한국어)",
      "goals": [
        {
          "goalTitle": "목표 항목명",
          "score": 4.5,
          "comment": "해당 목표에 대한 코멘트"
        }
      ]
    }
  ],
  "summary": "전체 팀에 대한 HR 종합 평가 요약 (3-5문장, 한국어)"
}`;

  const userPrompt = `평가 유형: ${evalLabel}

=== 골세팅 문서 ===
${goalContent}

${employeeList ? `=== 직원 명단 ===\n${employeeList}\n` : ""}

위 내용을 분석하여 각 직원별로 골세팅 달성 현황을 평가해주세요.
직원명단이 별도로 없다면 골세팅 문서에서 직원 정보를 추출해주세요.
각 직원의 개별 목표 항목별로 점수와 코멘트를 작성하고, 종합 점수와 피드백을 제공해주세요.
반드시 JSON 형식으로만 응답하세요.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let parsed_result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed_result = jsonMatch ? JSON.parse(jsonMatch[0]) : { employees: [], summary: "" };
    } catch {
      req.log.error({ rawContent }, "Failed to parse AI response as JSON");
      res.status(500).json({ error: "AI 응답 파싱 실패. 다시 시도해주세요." });
      return;
    }

    res.json({
      evaluationType,
      employees: parsed_result.employees ?? [],
      summary: parsed_result.summary ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI API error");
    res.status(500).json({ error: "AI 평가 중 오류가 발생했습니다. 다시 시도해주세요." });
  }
});

export default router;
