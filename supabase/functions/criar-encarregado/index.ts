// ============================================================
// Edge Function: criar-encarregado
// Cria o usuário de login (Auth) + o perfil em `usuarios`
// de uma vez, SEM precisar copiar UUID do banco.
//
// Deploy:  supabase functions deploy criar-encarregado
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { nome, email, senha, perfil, ativo } = await req.json();

    const nomeLimpo = String(nome || "").trim();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const perfilLimpo = perfil === "pintura" ? "pintura" : "encarregado";

    if (!nomeLimpo) return json({ error: "Informe o nome." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) return json({ error: "E-mail inválido." }, 400);
    if (!senha || String(senha).length < 6) return json({ error: "Senha precisa de no mínimo 6 caracteres." }, 400);

    // 1) Quem está chamando precisa ser admin ativo
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Não autenticado." }, 401);

    const { data: adminRow } = await userClient
      .from("usuarios")
      .select("id, perfil, ativo")
      .eq("id", user.id)
      .single();

    if (!adminRow || adminRow.perfil !== "admin" || adminRow.ativo === false) {
      return json({ error: "Somente admin pode criar encarregados." }, 403);
    }

    // 2) Criar (ou reaproveitar) o usuário de login
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: emailLimpo,
      password: String(senha),
      email_confirm: true,
      user_metadata: { nome: nomeLimpo, perfil: perfilLimpo },
    });

    let authUser = created?.user;

    if (createError || !authUser) {
      // Usuário já existe no Auth -> reaproveita o id
      const { data: list } = await adminClient.auth.admin.listUsers({ page: 1, per_page: 1000 });
      authUser = list?.users?.find((u) => u.email?.toLowerCase() === emailLimpo);
      if (!authUser) {
        return json({ error: createError?.message || "Erro ao criar usuário de login." }, 400);
      }
      // Atualiza a senha para a informada
      await adminClient.auth.admin.updateUserById(authUser.id, { password: String(senha) });
    }

    // 3) Criar/atualizar o perfil em public.usuarios
    const linha = {
      id: authUser.id,
      nome: nomeLimpo,
      email: emailLimpo,
      perfil: perfilLimpo,
      ativo: ativo !== false,
    };

    const { data: perfilSalvo, error: perfilError } = await adminClient
      .from("usuarios")
      .upsert([linha], { onConflict: "id" })
      .select()
      .single();

    if (perfilError) {
      return json({ error: perfilError.message || "Erro ao salvar perfil." }, 400);
    }

    return json({ perfil: perfilSalvo });
  } catch (erro) {
    console.error("criar-encarregado:", erro);
    return json({ error: "Erro interno ao criar encarregado." }, 500);
  }
});
