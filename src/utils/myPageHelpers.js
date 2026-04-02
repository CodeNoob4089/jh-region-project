export const JOB_OPTIONS = [
  "검성",
  "수호성",
  "살성",
  "궁성",
  "마도성",
  "정령성",
  "호법성",
  "치유성",
];

export const JOB_STYLE_MAP = {
  검성: "job-warrior",
  수호성: "job-guardian",
  살성: "job-assassin",
  궁성: "job-archer",
  마도성: "job-mage",
  정령성: "job-spirit",
  호법성: "job-support",
  치유성: "job-healer",
};

export function formatPowerK(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString()}K`;
}

export function getPowerTierClass(value) {
  const num = Math.max(0, Number(value || 0));

  if (num <= 100) return "tier-1";
  if (num <= 200) return "tier-2";
  if (num <= 300) return "tier-3";
  if (num <= 400) return "tier-4";
  if (num <= 500) return "tier-5";
  if (num <= 600) return "tier-6";
  if (num <= 700) return "tier-7";
  return "tier-8";
}