export type Role = "socio" | "staff" | "dueno";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  username: string | null;
  member_number: number | null;
  created_at: string;
};

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  created_at: string;
};

export type MembershipStatus = "activo" | "vencido" | "cancelado";

export type Membership = {
  id: string;
  socio_id: string;
  plan_id: string | null;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  amount_paid: number | null;
  created_by: string | null;
  created_at: string;
  membership_plans?: MembershipPlan | null;
};

export type GymClass = {
  id: string;
  name: string;
  schedule: string | null;
  instructor_id: string | null;
  capacity: number | null;
  description: string | null;
  created_at: string;
};

export type RequestStatus = "pendiente" | "en_progreso" | "completado";

export type RoutineRequest = {
  id: string;
  socio_id: string;
  objetivo: string;
  nivel: string | null;
  lesiones: string | null;
  sesiones_semana: number | null;
  status: RequestStatus;
  created_at: string;
  profiles?: Profile | null;
};

export type RoutineDay = {
  dia: string;
  ejercicios: { nombre: string; series: string; reps: string; notas?: string }[];
};

export type RoutineContent = {
  resumen: string;
  dias: RoutineDay[];
};

export type Routine = {
  id: string;
  socio_id: string;
  staff_id: string | null;
  request_id: string | null;
  title: string;
  contenido: RoutineContent;
  source: "ia" | "manual";
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  product_id: string | null;
  staff_id: string;
  socio_id: string | null;
  quantity: number;
  total: number;
  sale_date: string;
  created_at: string;
  products?: Product | null;
};

export type GymInfo = Record<string, string>;

export type CheckIn = {
  id: string;
  socio_id: string;
  staff_id: string | null;
  created_at: string;
  profiles?: Profile | null;
};

export type DayPass = {
  id: string;
  visitor_name: string;
  amount: number;
  staff_id: string | null;
  created_at: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  created_at: string;
};

export type Expense = {
  id: string;
  category_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  created_by: string | null;
  created_at: string;
  expense_categories?: ExpenseCategory | null;
};

export type PaymentProofStatus = "pendiente" | "revisado";

export type PaymentProof = {
  id: string;
  socio_id: string;
  file_path: string;
  note: string | null;
  status: PaymentProofStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: Profile | null;
};

export type Message = {
  id: string;
  socio_id: string;
  sender_id: string;
  sender_role: Role;
  body: string;
  created_at: string;
};
