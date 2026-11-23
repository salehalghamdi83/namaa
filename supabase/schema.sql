-- =====================================================================
-- نماء — قاعدة البيانات (Supabase / PostgreSQL)
-- شغّل هذا الملف مرة واحدة كاملًا من: SQL Editor → New query → Run
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- العائلات
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  created_at timestamptz not null default now()
);

-- بيانات الدخول لكل فرد (الرمز السري/كلمة المرور مشفّرة)
create table if not exists public.creds (
  family_id uuid not null references public.families(id) on delete cascade,
  member_id text not null,
  name text not null,
  role text not null check (role in ('father','mother','child')),
  color text,
  secret_hash text,
  primary key (family_id, member_id)
);

-- الأجهزة المسجّلة: كل جهاز = جلسة مجهولة مربوطة بفرد من العائلة
create table if not exists public.devices (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id text not null,
  role text not null,
  label text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- بيانات التطبيق (مستندات JSON بمسارات مثل fam/config و kids/<id>)
create table if not exists public.docs (
  family_id uuid not null references public.families(id) on delete cascade,
  path text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (family_id, path)
);
alter table public.docs replica identity full;

-- اشتراكات الإشعارات
create table if not exists public.push_subs (
  endpoint text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id text not null,
  role text not null,
  user_id uuid not null,
  sub jsonb not null,
  created_at timestamptz not null default now()
);

-- محاولات الدخول الخاطئة (حماية من التخمين)
create table if not exists public.login_fails (
  family_id uuid not null,
  member_id text not null,
  at timestamptz not null default now()
);

-- عدّاد استخدام الذكاء الاصطناعي اليومي
create table if not exists public.ai_usage (
  family_id uuid not null,
  day date not null,
  n int not null default 0,
  primary key (family_id, day)
);

-- ---------------------------------------------------------------------
-- دوال مساعدة
-- ---------------------------------------------------------------------
create or replace function public.my_family() returns uuid
language sql stable security definer set search_path = public as $$
  select family_id from devices where user_id = auth.uid()
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from devices where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- الصلاحيات (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.families   enable row level security;
alter table public.creds      enable row level security;
alter table public.devices    enable row level security;
alter table public.docs       enable row level security;
alter table public.push_subs  enable row level security;
alter table public.login_fails enable row level security;
alter table public.ai_usage   enable row level security;

drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select
  using (family_id = public.my_family());

-- مسارات fam/* (الإعدادات والمكافآت) لا يكتبها إلا الأب
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert
  with check (family_id = public.my_family() and (path not like 'fam/%' or public.my_role() = 'father'));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update
  using (family_id = public.my_family() and (path not like 'fam/%' or public.my_role() = 'father'))
  with check (family_id = public.my_family() and (path not like 'fam/%' or public.my_role() = 'father'));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete
  using (family_id = public.my_family() and public.my_role() in ('father','mother'));

-- بقية الجداول لا تُقرأ ولا تُكتب مباشرة؛ فقط عبر الدوال أدناه
-- (لا سياسات = لا وصول مباشر)

-- ---------------------------------------------------------------------
-- الدوال (RPC)
-- ---------------------------------------------------------------------

-- جهازي: من أنا وأي عائلة
create or replace function public.my_device()
returns table(family_id uuid, member_id text, role text, code text, family_name text)
language sql security definer set search_path = public as $$
  update devices set last_seen = now() where user_id = auth.uid();
  select d.family_id, d.member_id, d.role, f.code, f.name
  from devices d join families f on f.id = d.family_id
  where d.user_id = auth.uid();
$$;

-- إنشاء عائلة جديدة (يصبح هذا الجهاز جهاز الأب)
create or replace function public.create_family(p_family_name text, p_father_name text, p_password text)
returns table(family_id uuid, code text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_code text; i int := 0;
begin
  if auth.uid() is null then raise exception 'no_session'; end if;
  if exists (select 1 from devices where user_id = auth.uid()) then raise exception 'already_linked'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'weak_password'; end if;
  loop
    v_code := 'NAMAA-' || lpad((floor(random()*1000000))::int::text, 6, '0');
    exit when not exists (select 1 from families where families.code = v_code);
    i := i + 1; if i > 20 then raise exception 'code_gen'; end if;
  end loop;
  insert into families(code, name) values (v_code, p_family_name) returning id into v_id;
  insert into creds(family_id, member_id, name, role, secret_hash)
    values (v_id, 'father', p_father_name, 'father', crypt(p_password, gen_salt('bf')));
  insert into devices(user_id, family_id, member_id, role, label) values (auth.uid(), v_id, 'father', 'father', 'إنشاء العائلة');
  return query select v_id, v_code;
end $$;

-- أفراد العائلة (لشاشة اختيار الاسم قبل الدخول) — أسماء فقط
create or replace function public.family_members(p_code text)
returns table(member_id text, name text, role text, color text, has_secret boolean)
language sql security definer set search_path = public as $$
  select c.member_id, c.name, c.role, c.color, c.secret_hash is not null
  from creds c join families f on f.id = c.family_id
  where f.code = upper(trim(p_code))
  order by case c.role when 'father' then 0 when 'mother' then 1 else 2 end, c.name;
$$;

-- الدخول: رمز العائلة + الفرد + الرمز السري
-- تُرجع {ok:true,...} أو {ok:false,error:'bad_code|bad_member|bad_secret|locked|no_secret'}
-- (لا تُرمى أخطاء عند الرمز الخاطئ حتى تُحفظ المحاولة الفاشلة للحماية من التخمين)
drop function if exists public.join_family(text,text,text,text);
create or replace function public.join_family(p_code text, p_member_id text, p_secret text, p_label text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_f families; v_c creds; v_fails int;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','no_session'); end if;
  select * into v_f from families where families.code = upper(trim(p_code));
  if v_f.id is null then return jsonb_build_object('ok',false,'error','bad_code'); end if;
  select * into v_c from creds where creds.family_id = v_f.id and creds.member_id = p_member_id;
  if v_c.member_id is null then return jsonb_build_object('ok',false,'error','bad_member'); end if;
  if v_c.secret_hash is null then return jsonb_build_object('ok',false,'error','no_secret'); end if;
  select count(*) into v_fails from login_fails
    where login_fails.family_id = v_f.id and login_fails.member_id = p_member_id and at > now() - interval '15 minutes';
  if v_fails >= 8 then return jsonb_build_object('ok',false,'error','locked'); end if;
  if crypt(coalesce(p_secret,''), v_c.secret_hash) <> v_c.secret_hash then
    insert into login_fails(family_id, member_id) values (v_f.id, p_member_id);
    return jsonb_build_object('ok',false,'error','bad_secret','left', 7 - v_fails);
  end if;
  delete from login_fails where login_fails.family_id = v_f.id and login_fails.member_id = p_member_id;
  insert into devices(user_id, family_id, member_id, role, label)
    values (auth.uid(), v_f.id, v_c.member_id, v_c.role, p_label)
    on conflict (user_id) do update set family_id = excluded.family_id, member_id = excluded.member_id,
      role = excluded.role, label = excluded.label, last_seen = now();
  return jsonb_build_object('ok',true,'family_id',v_f.id,'member_id',v_c.member_id,'role',v_c.role,'code',v_f.code,'family_name',v_f.name);
end $$;

-- إضافة/تعديل فرد ورمزه (الأب فقط)
create or replace function public.set_member(p_member_id text, p_name text, p_role text, p_color text, p_secret text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.my_role() <> 'father' then raise exception 'forbidden'; end if;
  if p_role not in ('mother','child','father') then raise exception 'bad_role'; end if;
  if p_secret is not null and p_secret <> '' and length(p_secret) < 4 then raise exception 'weak_secret'; end if;
  insert into creds(family_id, member_id, name, role, color, secret_hash)
    values (public.my_family(), p_member_id, p_name, p_role, p_color,
            case when coalesce(p_secret,'') = '' then null else crypt(p_secret, gen_salt('bf')) end)
  on conflict (family_id, member_id) do update set
    name = excluded.name, role = excluded.role, color = excluded.color,
    secret_hash = coalesce(excluded.secret_hash, creds.secret_hash);
  update devices set role = p_role where devices.family_id = public.my_family() and devices.member_id = p_member_id;
end $$;

-- حذف فرد (الأب فقط) — يسحب أجهزته أيضًا
create or replace function public.remove_member(p_member_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'father' then raise exception 'forbidden'; end if;
  if p_member_id = 'father' then raise exception 'forbidden'; end if;
  delete from creds where family_id = public.my_family() and member_id = p_member_id;
  delete from devices where family_id = public.my_family() and member_id = p_member_id;
  delete from push_subs where family_id = public.my_family() and member_id = p_member_id;
end $$;

-- الأجهزة المسجّلة (الأب فقط)
create or replace function public.list_devices()
returns table(user_id uuid, member_id text, role text, label text, created_at timestamptz, last_seen timestamptz, is_me boolean)
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'father' then raise exception 'forbidden'; end if;
  return query select d.user_id, d.member_id, d.role, d.label, d.created_at, d.last_seen, d.user_id = auth.uid()
    from devices d where d.family_id = public.my_family() order by d.last_seen desc;
end $$;

create or replace function public.revoke_device(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'father' and p_user_id <> auth.uid() then raise exception 'forbidden'; end if;
  delete from push_subs where user_id = p_user_id and family_id = public.my_family();
  delete from devices where user_id = p_user_id and family_id = public.my_family();
end $$;

-- تسجيل خروج هذا الجهاز
create or replace function public.leave_device() returns void
language sql security definer set search_path = public as $$
  delete from push_subs where user_id = auth.uid();
  delete from devices where user_id = auth.uid();
$$;

-- حفظ اشتراك الإشعارات لهذا الجهاز
create or replace function public.save_push(p_endpoint text, p_sub jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare d devices;
begin
  select * into d from devices where user_id = auth.uid();
  if d.user_id is null then raise exception 'not_linked'; end if;
  insert into push_subs(endpoint, family_id, member_id, role, user_id, sub)
    values (p_endpoint, d.family_id, d.member_id, d.role, auth.uid(), p_sub)
  on conflict (endpoint) do update set family_id = excluded.family_id, member_id = excluded.member_id,
    role = excluded.role, user_id = excluded.user_id, sub = excluded.sub;
end $$;

-- صلاحيات التنفيذ
revoke all on function public.create_family(text,text,text) from public;
grant execute on function public.my_device(), public.create_family(text,text,text), public.family_members(text),
  public.join_family(text,text,text,text), public.set_member(text,text,text,text,text), public.remove_member(text),
  public.list_devices(), public.revoke_device(uuid), public.leave_device(), public.save_push(text,jsonb)
  to authenticated;
grant execute on function public.family_members(text) to anon;

-- ---------------------------------------------------------------------
-- التحديث اللحظي
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ---------------------------------------------------------------------
-- تخزين التسجيلات الصوتية (خاص بكل عائلة)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('audio', 'audio', false, 15728640)
on conflict (id) do nothing;

drop policy if exists audio_read on storage.objects;
create policy audio_read on storage.objects for select to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = public.my_family()::text);
drop policy if exists audio_insert on storage.objects;
create policy audio_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = public.my_family()::text);
drop policy if exists audio_delete on storage.objects;
create policy audio_delete on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = public.my_family()::text);
