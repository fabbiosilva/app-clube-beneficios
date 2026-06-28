/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Este é o arquivo oficial de configuração do cliente Supabase para o front-end.
// No ambiente de visualização, utilizamos um banco de dados integrado reativo (mockDb).
// Para o seu ambiente de produção da Vercel, certifique-se de configurar
// as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel da Vercel.

import { createClient } from '@supabase/supabase-js';

// Caso queira instalar o pacote @supabase/supabase-js, basta rodar:
// npm install @supabase/supabase-js
//
// O código abaixo realiza o fallback seguro para não quebrar a compilação do preview.

const ambientMeta = import.meta as any;
const supabaseUrl = ambientMeta.env?.VITE_SUPABASE_URL || 'https://suasubstituicao.supabase.co';
const supabaseAnonKey = ambientMeta.env?.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima-aqui';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
