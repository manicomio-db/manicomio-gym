-- ============================================================================
-- Datos de ejemplo opcionales — ejecutar después de schema.sql.
-- Estos datos no requieren cuentas de usuario (planes, clases, productos, info).
-- ============================================================================

insert into public.membership_plans (name, price, duration_days, description) values
  ('Mensual', 450.00, 30, 'Acceso completo al gimnasio, 30 días.'),
  ('Trimestral', 1200.00, 90, 'Acceso completo, 3 meses, ahorra vs. mensual.'),
  ('Anual', 4200.00, 365, 'Acceso completo por 12 meses, el mejor precio por mes.')
on conflict (name) do nothing;

insert into public.classes (name, schedule, capacity, description) values
  ('Funcional', 'Lun/Mié/Vie 7:00 - 8:00 AM', 15, 'Circuito de fuerza y cardio.'),
  ('Spinning', 'Mar/Jue 6:00 - 7:00 PM', 20, 'Cardio en bici de alta intensidad.'),
  ('Yoga', 'Sáb 9:00 - 10:00 AM', 12, 'Flexibilidad y control de respiración.')
on conflict (name) do nothing;

insert into public.products (name, description, price, stock, category) values
  ('Proteína Whey 1kg', 'Sabor chocolate', 650.00, 20, 'Suplementos'),
  ('Shaker 600ml', 'Vaso mezclador', 90.00, 40, 'Accesorios'),
  ('Guantes de entrenamiento', 'Talla M/L', 180.00, 15, 'Accesorios')
on conflict (name) do nothing;

insert into public.gym_info (key, value) values
  ('nombre_gimnasio', 'Mi Gimnasio'),
  ('horario_general', 'Lun a Vie 6:00 AM - 10:00 PM, Sáb 8:00 AM - 2:00 PM'),
  ('contacto_telefono', '555-000-0000'),
  ('contacto_direccion', 'Dirección pendiente de actualizar'),
  ('texto_bienvenida', 'Entrena con nosotros y alcanza tus metas.')
on conflict (key) do nothing;
