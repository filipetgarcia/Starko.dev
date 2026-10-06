-- Helper functions are only for triggers and security rules, not the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
