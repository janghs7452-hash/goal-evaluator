import { create } from "zustand";
import type { EvaluateResponse } from "@workspace/api-client-react";

interface EvaluationStore {
  result: EvaluateResponse | null;
  setResult: (res: EvaluateResponse) => void;
  clearResult: () => void;
}

export const useEvaluationStore = create<EvaluationStore>((set) => ({
  result: null,
  setResult: (res) => set({ result: res }),
  clearResult: () => set({ result: null }),
}));
