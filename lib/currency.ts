export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function trimTrailingZero(value: string) {
  return value.replace(/\.0$/, "");
}

export function formatPKRCompact(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs >= 1_000_000) {
    return `${sign}PKR ${trimTrailingZero((abs / 1_000_000).toFixed(2))}M`;
  }
  if (abs >= 1_000) {
    return `${sign}PKR ${trimTrailingZero((abs / 1_000).toFixed(1))}k`;
  }
  return formatPKR(amount);
}
