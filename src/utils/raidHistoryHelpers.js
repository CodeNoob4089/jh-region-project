export function formatTime(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  return `${parts[0]}:${parts[1]}`;
}

export function formatDateWithDay(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[date.getDay()];

  return `${month}/${day} (${dayName})`;
}

export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "-";

  const date = new Date(dateTimeString);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

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