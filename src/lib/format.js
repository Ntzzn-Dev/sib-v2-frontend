export const fmt = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0),
  );
export const read = (obj, path) =>
  path.split(".").reduce((value, key) => value?.[key], obj);
export const boolValue = (obj, key) =>
  key === "selled"
    ? (obj?.selled ?? obj?.isSelled ?? false)
    : (obj?.[key] ?? obj?.isActiveMetodoPag ?? false);
export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "S";
export const formatCpf = (value = "") => {
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  let formatted = digits.slice(0, 3);
  if (digits.length > 3) formatted += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  return formatted;
};
export const formatCep = (value = "") => {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
};
export const saleDate = (value = "") => {
  const [date, time = "00:00"] = value.split(" ");
  const [day, month, year] = (date || "").split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return day && month && year
    ? new Date(2000 + year, month - 1, day, hour || 0, minute || 0)
    : null;
};
export const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());
