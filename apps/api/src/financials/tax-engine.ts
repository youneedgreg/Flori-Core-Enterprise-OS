export function calculateNssf(gross: number): number {
  if (gross <= 8000) {
    return gross * 0.06;
  } else if (gross <= 36000) {
    return (8000 * 0.06) + ((gross - 8000) * 0.06);
  }
  return 2160;
}

export function calculateShif(gross: number): number {
  return gross * 0.0275;
}

export function calculatePaye(gross: number, nssf: number, shif: number): number {
  const taxableIncome = gross - nssf;
  
  if (taxableIncome <= 24000) return 0;
  
  let tax = 0;
  let remaining = taxableIncome;

  if (remaining > 24000) {
    tax += 24000 * 0.10;
    remaining -= 24000;
  } else {
    tax += remaining * 0.10;
    remaining = 0;
  }

  if (remaining > 8333) {
    tax += 8333 * 0.25;
    remaining -= 8333;
  } else {
    tax += remaining * 0.25;
    remaining = 0;
  }

  if (remaining > 467667) {
    tax += 467667 * 0.30;
    remaining -= 467667;
  } else {
    tax += remaining * 0.30;
    remaining = 0;
  }

  if (remaining > 300000) {
    tax += 300000 * 0.325;
    remaining -= 300000;
  } else {
    tax += remaining * 0.325;
    remaining = 0;
  }

  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  const personalRelief = 2400;
  const shifRelief = shif * 0.15;
  
  tax = tax - personalRelief - shifRelief;
  return tax > 0 ? tax : 0;
}
