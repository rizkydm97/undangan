-- Membuat akun admin: username "admin", password "admin123"
-- Jalankan di Supabase: SQL Editor > New query > Run
create extension if not exists pgcrypto;
delete from auth.users where email = 'admin@admin.com';
do $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','admin@admin.com',crypt('admin123',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
  insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email','admin@admin.com','email_verified',true),'email',now(),now(),now());
end $$;

-- Ganti password nanti (disarankan):
-- update auth.users set encrypted_password = crypt('PASSWORD_BARU',gen_salt('bf')) where email='admin@admin.com';
