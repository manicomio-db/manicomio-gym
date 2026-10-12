import { todayLocal } from "@/lib/date";
import type { HealthProfile } from "@/lib/types";

export const CONDITIONS: { value: string; label: string }[] = [
  { value: "hipertension", label: "Hipertensión (presión alta)" },
  { value: "diabetes", label: "Diabetes" },
  { value: "cardiaco", label: "Problema del corazón" },
  { value: "asma", label: "Asma o problema respiratorio" },
  { value: "artritis", label: "Artritis o artrosis" },
  { value: "osteoporosis", label: "Osteoporosis" },
  { value: "columna", label: "Problema de columna (hernia, escoliosis)" },
  { value: "embarazo", label: "Embarazo o posparto reciente" },
  { value: "obesidad", label: "Obesidad" },
  { value: "tiroides", label: "Problema de tiroides" },
  { value: "colesterol", label: "Colesterol o triglicéridos altos" },
];

export const CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, c.label])
);

/** Cuestionario PAR-Q (preparación para la actividad física). */
export const PARQ_QUESTIONS: { key: string; text: string }[] = [
  { key: "q1", text: "¿Algún médico te ha dicho que tienes un problema del corazón y que solo debes hacer la actividad física que él te recomiende?" },
  { key: "q2", text: "¿Sientes dolor en el pecho cuando haces actividad física?" },
  { key: "q3", text: "En el último mes, ¿has sentido dolor en el pecho estando en reposo?" },
  { key: "q4", text: "¿Pierdes el equilibrio por mareos o has perdido el conocimiento alguna vez?" },
  { key: "q5", text: "¿Tienes algún problema de huesos o articulaciones que podría empeorar con la actividad física?" },
  { key: "q6", text: "¿Te receta actualmente tu médico medicamentos para la presión arterial o el corazón?" },
  { key: "q7", text: "¿Conoces alguna otra razón por la que no deberías hacer actividad física?" },
];

export const SEX_LABEL: Record<string, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  otro: "Otro",
  prefiero_no_decir: "Prefiere no decir",
};

export const ACTIVITY_LABEL: Record<string, string> = {
  sedentario: "Sedentario (casi no se mueve)",
  ligero: "Ligero (1–2 veces por semana)",
  moderado: "Moderado (3–4 veces por semana)",
  activo: "Activo (5 o más veces por semana)",
};

export const AGE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Menos de 18", min: 0, max: 17 },
  { label: "18 – 24", min: 18, max: 24 },
  { label: "25 – 34", min: 25, max: 34 },
  { label: "35 – 44", min: 35, max: 44 },
  { label: "45 – 54", min: 45, max: 54 },
  { label: "55 – 64", min: 55, max: 64 },
  { label: "65 o más", min: 65, max: 200 },
];

/** Edad en años cumplidos a la fecha (hoy, en la zona del gimnasio). */
export function ageFromBirthDate(birthDate: string, today: string = todayLocal()): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age;
}

export function bmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number | null): string | null {
  if (value === null) return null;
  if (value < 18.5) return "Bajo peso";
  if (value < 25) return "Peso normal";
  if (value < 30) return "Sobrepeso";
  return "Obesidad";
}

export type RiskLevel = "ninguno" | "precaucion" | "consultar_medico";

export type RiskAssessment = { level: RiskLevel; reasons: string[] };

/**
 * Semáforo simple para el staff. No es un diagnóstico: solo avisa cuándo
 * conviene pedir visto bueno médico o adaptar con más cuidado la rutina.
 */
export function assessRisk(h: HealthProfile): RiskAssessment {
  const reasons: string[] = [];
  let level: RiskLevel = "ninguno";
  const raise = (to: RiskLevel) => {
    const order: RiskLevel[] = ["ninguno", "precaucion", "consultar_medico"];
    if (order.indexOf(to) > order.indexOf(level)) level = to;
  };

  const parqYes = PARQ_QUESTIONS.filter((q) => h.parq?.[q.key]);
  if (parqYes.length > 0) {
    raise("consultar_medico");
    reasons.push(`Respondió "Sí" en ${parqYes.length} pregunta(s) del cuestionario PAR-Q`);
  }

  if (h.conditions.includes("cardiaco")) {
    raise("consultar_medico");
    reasons.push("Problema del corazón");
  }
  if (h.conditions.includes("embarazo")) {
    raise("consultar_medico");
    reasons.push("Embarazo o posparto reciente");
  }

  const precautionConditions = h.conditions.filter((c) => c !== "cardiaco" && c !== "embarazo");
  if (precautionConditions.length > 0) {
    raise("precaucion");
    reasons.push(
      `Condiciones: ${precautionConditions.map((c) => CONDITION_LABEL[c] ?? c).join(", ")}`
    );
  }
  if (h.conditions_other?.trim()) {
    raise("precaucion");
    reasons.push(`Otra condición: ${h.conditions_other.trim()}`);
  }
  if (h.injuries?.trim()) {
    raise("precaucion");
    reasons.push("Lesiones o cirugías reportadas");
  }

  const age = ageFromBirthDate(h.birth_date);
  if (age < 18) {
    raise("precaucion");
    reasons.push("Menor de edad: confirma la autorización de su tutor");
  } else if (age >= 60) {
    raise("precaucion");
    reasons.push("60 años o más: priorizar equilibrio, movilidad y bajo impacto");
  }

  return { level, reasons };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  ninguno: "Sin alertas",
  precaucion: "Precaución",
  consultar_medico: "Pedir visto bueno médico",
};

/** Texto con los datos de la ficha para incluir en el prompt de la IA. */
export function healthSummaryForPrompt(h: HealthProfile): string {
  const age = ageFromBirthDate(h.birth_date);
  const imc = bmi(h.weight_kg, h.height_cm);
  const parqYes = PARQ_QUESTIONS.filter((q) => h.parq?.[q.key]).map((q) => q.text);
  const conditions = [
    ...h.conditions.map((c) => CONDITION_LABEL[c] ?? c),
    ...(h.conditions_other?.trim() ? [h.conditions_other.trim()] : []),
  ];

  return [
    `- Edad: ${age} años`,
    `- Sexo: ${h.sex ? (SEX_LABEL[h.sex] ?? h.sex) : "no indicado"}`,
    `- Peso / estatura: ${h.weight_kg ?? "?"} kg / ${h.height_cm ?? "?"} cm${imc ? ` (IMC ${imc}, ${bmiCategory(imc)})` : ""}`,
    `- Actividad física actual: ${h.activity_level ? ACTIVITY_LABEL[h.activity_level] : "no indicada"}`,
    `- Condiciones de salud: ${conditions.length ? conditions.join("; ") : "ninguna reportada"}`,
    `- Lesiones o cirugías: ${h.injuries?.trim() || "ninguna reportada"}`,
    `- Medicamentos: ${h.medications?.trim() || "ninguno reportado"}`,
    `- Cuestionario PAR-Q, respuestas "Sí": ${parqYes.length ? parqYes.join(" | ") : "ninguna"}`,
    `- Notas del socio: ${h.notes?.trim() || "ninguna"}`,
  ].join("\n");
}
