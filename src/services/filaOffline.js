// Fila offline de RDOs: salva no aparelho quando não há internet
// e tenta enviar automaticamente quando a conexão voltar.
const CHAVE = "rdo_fila_offline";

export function lerFila() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
}

function gravarFila(fila) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(fila));
  } catch (erro) {
    console.error("Erro ao gravar fila offline:", erro);
  }
}

export function enfileirarRDO(payload) {
  const fila = lerFila();
  // Evita duplicar a mesma RDO (obra + pessoa + data) na fila
  const jaExiste = fila.some(
    (item) =>
      String(item.obra_id) === String(payload.obra_id) &&
      String(item.encarregado_id) === String(payload.encarregado_id) &&
      item.data === payload.data
  );
  if (jaExiste) return false;
  fila.push({ ...payload, enfileiradoEm: new Date().toISOString() });
  gravarFila(fila);
  return true;
}

export function ehErroDeRede(erro) {
  const msg = String(erro?.message || erro || "");
  return (
    !navigator.onLine ||
    erro instanceof TypeError ||
    /failed to fetch|network|offline|load failed/i.test(msg)
  );
}

export function ehDuplicada(erro) {
  return (
    erro?.code === "23505" ||
    /duplicate key|rdos_obra_id_data_key|rdos_uma_por_usuario_por_dia/i.test(erro?.message || "")
  );
}

async function enviarPayload(supabase, payload) {
  const { data: novaRDO, error: rdoError } = await supabase
    .from("rdos")
    .insert([{
      obra_id: payload.obra_id,
      encarregado_id: payload.encarregado_id,
      encarregado_nome: payload.encarregado_nome || null,
      equipe_id: payload.equipe_id || null,
      equipe_nome: payload.equipe_nome || null,
      data: payload.data,
      observacoes: payload.observacoes || null,
    }])
    .select("id")
    .single();
  if (rdoError) throw rdoError;

  const comRdoId = (linhas) =>
    (linhas || []).map((linha) => ({ ...linha, rdo_id: novaRDO.id }));

  const passos = [
    ["rdo_producao", payload.producaoParaSalvar],
    ["rdo_efetivo", payload.efetivoParaSalvar],
    ["rdo_motivos", payload.motivosParaSalvar],
    ["rdo_materiais", payload.materiaisParaSalvar],
  ];
  for (const [tabela, linhas] of passos) {
    if (linhas && linhas.length > 0) {
      const { error } = await supabase.from(tabela).insert(comRdoId(linhas));
      if (error) throw error;
    }
  }
}

// Processa a fila. Retorna quantas foram enviadas.
export async function processarFila(supabase) {
  if (!navigator.onLine) return 0;
  const fila = lerFila();
  if (fila.length === 0) return 0;

  let enviadas = 0;
  const restantes = [];

  for (const item of fila) {
    try {
      await enviarPayload(supabase, item);
      enviadas += 1;
    } catch (erro) {
      console.error("Erro ao enviar RDO da fila:", erro);
      if (ehDuplicada(erro)) {
        // Já foi enviada (ou outro aparelho enviou) — remove da fila
        enviadas += 1;
      } else if (ehErroDeRede(erro)) {
        restantes.push(item);
      } else {
        // Erro não-rede: mantém na fila para revisão manual
        restantes.push(item);
      }
    }
  }

  gravarFila(restantes);
  return enviadas;
}
