// SM-2 implementation with 3-button mapping
export function gradeFromLabel(label) {
  // Hard, Medium, Easy -> 2,3,5
  const map = { hard: 2, medium: 3, easy: 5 };
  return map[label] ?? 3;
}

export function sm2Next({ ef = 2.5, interval = 0, repetitions = 0 }, q) {
  // q: 0..5
  let newEf = ef;
  let newReps = repetitions;
  let newInterval = interval;

  if (q < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    if (newReps === 0) newInterval = 1;
    else if (newReps === 1) newInterval = 6;
    else newInterval = Math.round(newInterval * newEf);

    newReps += 1;

    newEf = newEf + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEf < 1.3) newEf = 1.3;
  }

  const now = Date.now();
  const dueAt = now + newInterval * 24 * 60 * 60 * 1000;

  return { ef: newEf, interval: newInterval, repetitions: newReps, dueAt };
}