# Mi Gimnasio — Sistema de gestión

App para administrar un gimnasio: portal de socios, portal de staff/instructores (con generación de rutinas por IA) y panel de director con control total.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + Row Level Security)
- Anthropic Claude API para generar rutinas

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta, en este orden:
   - [`sql/schema.sql`](sql/schema.sql) — tablas, funciones, triggers y políticas RLS.
   - [`sql/seed.sql`](sql/seed.sql) — datos de ejemplo (planes, clases, productos, info) opcionales.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (sección "secret keys") → `SUPABASE_SERVICE_ROLE_KEY` (nunca la expongas al navegador; solo se usa en el servidor para que el director cree cuentas de staff).

## 2. Configurar la API de Claude

1. Crea una API key en [console.anthropic.com](https://console.anthropic.com).
2. Ponla en `ANTHROPIC_API_KEY`.

## 3. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena los tres valores anteriores en `.env.local`.

## 4. Crear la primera cuenta de Director

Las cuentas de `socio` se auto-registran desde `/signup`. Las cuentas de `staff` solo puede crearlas un `dueno` desde `/dueno/staff`. Por eso la **primera** cuenta de director hay que crearla a mano:

1. Regístrate normalmente en `/signup` (queda creada como `socio`).
2. En Supabase → **SQL Editor**, ejecuta:
   ```sql
   update public.profiles set role = 'dueno' where id =
     (select id from auth.users where email = 'tu-correo@ejemplo.com');
   ```
3. Cierra sesión y vuelve a entrar: ya tendrás acceso a `/dueno`.

## 5. Correr en desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura de roles

| Rol | Acceso |
|---|---|
| `socio` | `/socio` — ver vencimiento de membresía, pedir/ver rutina, catálogo de tienda |
| `staff` | `/staff` — atender solicitudes de rutina, generarlas con IA, registrar ventas, actualizar vencimientos |
| `dueno` | `/dueno` — todo lo anterior + planes, clases, productos, cuentas de staff y contenido de la página principal |
