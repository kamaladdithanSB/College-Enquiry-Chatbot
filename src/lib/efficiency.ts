export function calculateEfficiencyGain(
  manualHours: number,
  vedaHours: number,
): number {
  if (manualHours <= 0) {
    return 0;
  }

  const ratio = ((manualHours - vedaHours) / manualHours) * 100;
  return Math.max(0, Number(ratio.toFixed(1)));
}

export function estimateEfficiencyFromPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();

  let manualHours = 2.5;
  if (/compare|shortlist|side by side|roi/.test(normalized)) {
    manualHours += 1.8;
  }
  if (/deadline|intake|scholarship|application/.test(normalized)) {
    manualHours += 1.2;
  }
  if (/fees|tuition|tcoa|cost/.test(normalized)) {
    manualHours += 1.4;
  }

  const vedaHours = Number((manualHours * 0.34).toFixed(1));
  const gainPercentage = calculateEfficiencyGain(manualHours, vedaHours);

  return {
    manualHours: Number(manualHours.toFixed(1)),
    vedaHours,
    gainPercentage,
  };
}
