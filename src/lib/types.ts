export type Role = "socio" | "staff" | "dueno";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
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
