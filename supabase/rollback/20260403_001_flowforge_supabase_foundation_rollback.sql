drop publication if exists supabase_realtime;

drop table if exists public.sync_states cascade;
drop table if exists public.notifications cascade;
drop table if exists public.error_logs cascade;
drop table if exists public.usage_logs cascade;
drop table if exists public.api_key_configs cascade;
drop table if exists public.prompt_templates cascade;
drop table if exists public.ai_models cascade;
drop table if exists public.ai_task_logs cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.suggestions cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.llm_functions cascade;
drop table if exists public.tasks cascade;
drop table if exists public.blockers cascade;
drop table if exists public.readiness_checks cascade;
drop table if exists public.audit_findings cascade;
drop table if exists public.prd_sections cascade;
drop table if exists public.ui_style_systems cascade;
drop table if exists public.ui_components cascade;
drop table if exists public.ui_pages cascade;
drop table if exists public.ui_layouts cascade;
drop table if exists public.project_versions cascade;
drop table if exists public.feature_comments cascade;
drop table if exists public.features cascade;
drop table if exists public.sessions cascade;
drop table if exists public.projects cascade;
drop table if exists public.roles cascade;
drop table if exists public.app_users cascade;

drop function if exists public.can_modify_project(text);
drop function if exists public.can_access_project(text);
drop function if exists public.is_admin_user();
drop function if exists public.current_app_user_id();
drop function if exists public.set_updated_at();

drop type if exists public.app_user_role;