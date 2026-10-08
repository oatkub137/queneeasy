function readEnv(name: string) {
  const viteEnv = import.meta.env as Record<string, string | boolean | undefined>;
  const fromVite = viteEnv[name];
  if (typeof fromVite === 'string' && fromVite.length > 0) return fromVite;
  if (typeof process === 'undefined') return undefined;
  const fromProcess = process.env[name];
  return typeof fromProcess === 'string' && fromProcess.length > 0 ? fromProcess : undefined;
}

export function publicSupabaseUrl() {
  return (
    readEnv('VITE_SUPABASE_URL') ??
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ??
    readEnv('SUPABASE_URL')
  );
}

export function publicSupabaseKey() {
  return (
    readEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ??
    readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    readEnv('SUPABASE_PUBLISHABLE_KEY') ??
    readEnv('VITE_SUPABASE_ANON_KEY') ??
    readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
    readEnv('SUPABASE_ANON_KEY')
  );
}
