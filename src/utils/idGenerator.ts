export function generateProjectId(lastNumber: number) {
  return `PRJ-${String(lastNumber).padStart(6, "0")}`;
}

export function generateBudgetId(lastNumber: number) {
  return `BGT-${String(lastNumber).padStart(6, "0")}`;
}

export function generateChapterId(lastNumber: number) {
  return `CH-${String(lastNumber).padStart(3, "0")}`;
}

export function generateItemId(lastNumber: number) {
  return `ITM-${String(lastNumber).padStart(4, "0")}`;
}