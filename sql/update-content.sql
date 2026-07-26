-- Contenido general de la página principal
insert into public.gym_info (key, value) values
  ('nombre_gimnasio', 'Manicomio Gym'),
  ('texto_bienvenida', '¡Bienvenido a la familia de El Manicomio Gym! Más que un espacio para entrenar, somos una comunidad de apasionados por el fitness que se empujan mutuamente para ser mejores cada día. Sin importar si vas empezando o si ya tienes experiencia en los fierros, aquí encontrarás el ambiente perfecto para romper tus propios límites. Entra bajo tu propio riesgo: los resultados son adictivos. 💪'),
  ('horario_general', 'Lun a Vie 6:00 AM - 10:30 PM, Sáb 7:00 AM - 3:00 PM, Dom 9:00 AM - 1:00 PM'),
  ('contacto_direccion', 'Av. Tláhuac Tulyehualco 8480, Col. Los Reyes, C.P. 13080 (dentro del estacionamiento del Aurrera Express)')
on conflict (key) do update set value = excluded.value;

-- Planes existentes: precio y duración reales
update public.membership_plans set price = 400, duration_days = 30, description = null where name = 'Mensual';
update public.membership_plans set price = 1000, duration_days = 90, description = null where name = 'Trimestral';
update public.membership_plans set price = 2500, duration_days = 365, description = null where name = 'Anual';

-- Planes nuevos
insert into public.membership_plans (name, price, duration_days) values
  ('Bimestral', 700, 60),
  ('Semestral', 1500, 180)
on conflict (name) do update set price = excluded.price, duration_days = excluded.duration_days;
