export const PASS_MARK = 70;

export type RequirementState = {
  requiredLessonsDone: boolean;
  requiredActivitiesApproved: boolean;
  finalExamGrade: number | null;
  projectApproved: boolean;
};

/**
 * Regra de desbloqueio do módulo seguinte.
 * A verificação deve ser feita no servidor, nunca apenas no navegador.
 */
export function canUnlockNextModule(state: RequirementState): boolean {
  return (
    state.requiredLessonsDone &&
    state.requiredActivitiesApproved &&
    state.projectApproved &&
    state.finalExamGrade !== null &&
    Number.isFinite(state.finalExamGrade) &&
    state.finalExamGrade >= PASS_MARK && state.finalExamGrade <= 100
  );
}

export function calculateProgress(completed: number, total: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(completed) || total <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, completed / total)) * 100);
}
