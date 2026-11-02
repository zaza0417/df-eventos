/** Opções do filtro "Quando" da tela inicial. */
export const PERIODOS = [
  { valor: '', nome: 'Qualquer data' },
  { valor: 'hoje', nome: 'Hoje' },
  { valor: '7dias', nome: 'Próximos 7 dias' },
  { valor: '30dias', nome: 'Próximos 30 dias' },
];

/** Data no formato AAAA-MM-DD usando o fuso do navegador (não UTC). */
export function paraIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Converte o período escolhido em intervalo de datas para a API. */
export function intervaloDoPeriodo(periodo: string | null): { de?: string; ate?: string } {
  const dias = { hoje: 0, '7dias': 6, '30dias': 29 }[periodo ?? ''];
  if (dias === undefined) return {};
  const hoje = new Date();
  const fim = new Date(hoje);
  fim.setDate(hoje.getDate() + dias);
  return { de: paraIso(hoje), ate: paraIso(fim) };
}

/** "09:00:00" → "09h"; "09:30:00" → "09h30". */
export function horaCurta(hora: string): string {
  const [h, m] = hora.split(':');
  return m === '00' ? `${h}h` : `${h}h${m}`;
}
