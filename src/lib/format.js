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
  if (!value) return null;

  const text = String(value).trim();
  const iso = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/,
  );
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] || 0),
      Number(iso[5] || 0),
      Number(iso[6] || 0),
      Number((iso[7] || "").slice(0, 3).padEnd(3, "0")),
    );
  }

  const [date, time = "00:00"] = text.split(/\s+/);
  const partes = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!partes) return null;

  const [, diaTexto, mesTexto, anoTexto] = partes;
  const [hora = 0, minuto = 0, segundo = 0] = time.split(":").map(Number);
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = anoTexto.length === 2 ? 2000 + Number(anoTexto) : Number(anoTexto);
  const resultado = new Date(ano, mes - 1, dia, hora, minuto, segundo);
  return resultado.getFullYear() === ano &&
    resultado.getMonth() === mes - 1 &&
    resultado.getDate() === dia
    ? resultado
    : null;
};
export const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());
