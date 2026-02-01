INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000101',
  '1.user@example.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now()
) RETURNING id;

INSERT INTO profiles (id, first_name, last_name, email, role)
VALUES (
  '3eff70d6-d1f4-4550-8094-cacc880e11fc',
  'Test',
  'User',
  'testa.user@example.com',
  'EMPLOYEE'
);

delete from auth.users where id = '3ca949e3-3f5c-42aa-ac49-ee660bc5d4da';