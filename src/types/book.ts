export interface Book {
  id: string;
  titulo: string;
  autor: string;
  paginas: number;
  categoria: string;
  imagem_url: string | null;
  status: 'quero_ler' | 'lendo' | 'lido';
  created_at: string;
}

export const CATEGORIES = [
  'Fantasia',
  'Ficção Científica',
  'Romance',
  'Terror',
  'Suspense',
  'Aventura',
  'Biografia',
  'História',
  'Desenvolvimento Pessoal',
  'Negócios',
] as const;

export const STATUS_LABELS: Record<Book['status'], string> = {
  quero_ler: 'Quero Ler',
  lendo: 'Estou Lendo',
  lido: 'Já Li',
};

export const STATUS_COLUMNS: Book['status'][] = ['quero_ler', 'lendo', 'lido'];
