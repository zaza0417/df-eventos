// Mantenha igual a api/_app/constantes.py.
// O ícone de cada categoria fica em shared/icone/icone.ts, com o mesmo nome do slug.

import type { NomeIcone } from '../shared/icone/icone';

export interface Categoria {
  slug: string;
  nome: string;
}

export const CATEGORIAS: Categoria[] = [
  { slug: 'vacinacao', nome: 'Vacinação' },
  { slug: 'saude_mental', nome: 'Saúde mental' },
  { slug: 'atividade_fisica', nome: 'Atividade física' },
  { slug: 'nutricao', nome: 'Nutrição' },
  { slug: 'doacao_sangue', nome: 'Doação de sangue' },
  { slug: 'saude_mulher', nome: 'Saúde da mulher' },
  { slug: 'saude_idoso', nome: 'Saúde do idoso' },
  { slug: 'prevencao', nome: 'Prevenção e exames' },
];

export function categoria(slug: string): Categoria {
  return CATEGORIAS.find((c) => c.slug === slug) ?? { slug, nome: 'Outros' };
}

/** Nome do ícone da categoria (o slug é o próprio nome do ícone). */
export function iconeCategoria(slug: string): NomeIcone {
  return (CATEGORIAS.some((c) => c.slug === slug) ? slug : 'calendario') as NomeIcone;
}

export const REGIOES: string[] = [
  'Plano Piloto', 'Águas Claras', 'Brazlândia', 'Ceilândia', 'Cruzeiro', 'Gama', 'Guará',
  'Itapoã', 'Lago Norte', 'Lago Sul', 'Núcleo Bandeirante', 'Paranoá', 'Planaltina',
  'Recanto das Emas', 'Riacho Fundo', 'Samambaia', 'Santa Maria', 'São Sebastião',
  'Sobradinho', 'Sudoeste/Octogonal', 'Taguatinga', 'Vicente Pires',
];
