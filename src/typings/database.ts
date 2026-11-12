/**
 * Espelho de `supabase/schema.sql`, no formato do `supabase gen types typescript`. Se o
 * schema mudar, regenere com:
 *
 *   npx supabase gen types typescript --project-id <id> > src/typings/database.ts
 *
 * e troque de novo as colunas de "enum" e de jsonb pelos tipos de `lib/constants` e `typings`.
 */

import type { FormaPagamento, PedidoStatus, Role, TipoEntrega } from "~/lib/constants"
import type { Endereco, EnderecoInput, PedidoItem, PedidoItemInput } from "~/typings"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    nome: string | null
                    email: string | null
                    telefone: string | null
                    cep: string | null
                    logradouro: string | null
                    numero: string | null
                    complemento: string | null
                    bairro: string | null
                    cidade: string | null
                    uf: string | null
                    role: Role
                    criado_em: string
                }
                Insert: {
                    id: string
                    nome?: string | null
                    email?: string | null
                    telefone?: string | null
                    cep?: string | null
                    logradouro?: string | null
                    numero?: string | null
                    complemento?: string | null
                    bairro?: string | null
                    cidade?: string | null
                    uf?: string | null
                    role?: Role
                    criado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string | null
                    email?: string | null
                    telefone?: string | null
                    cep?: string | null
                    logradouro?: string | null
                    numero?: string | null
                    complemento?: string | null
                    bairro?: string | null
                    cidade?: string | null
                    uf?: string | null
                    role?: Role
                    criado_em?: string
                }
                Relationships: []
            }
            configuracoes: {
                Row: {
                    id: number
                    nome: string
                    slogan: string | null
                    logo_path: string | null
                    cor: string
                    whatsapp: string | null
                    instagram: string | null
                    endereco: string | null
                    horario: string | null
                    aberta: boolean
                    aviso: string | null
                    aceita_entrega: boolean
                    aceita_retirada: boolean
                    taxa_entrega: number
                    frete_gratis_acima: number | null
                    pedido_minimo: number
                    formas_pagamento: FormaPagamento[]
                    chave_pix: string | null
                    atualizado_em: string
                }
                Insert: {
                    id?: number
                    nome?: string
                    slogan?: string | null
                    logo_path?: string | null
                    cor?: string
                    whatsapp?: string | null
                    instagram?: string | null
                    endereco?: string | null
                    horario?: string | null
                    aberta?: boolean
                    aviso?: string | null
                    aceita_entrega?: boolean
                    aceita_retirada?: boolean
                    taxa_entrega?: number
                    frete_gratis_acima?: number | null
                    pedido_minimo?: number
                    formas_pagamento?: FormaPagamento[]
                    chave_pix?: string | null
                    atualizado_em?: string
                }
                Update: {
                    id?: number
                    nome?: string
                    slogan?: string | null
                    logo_path?: string | null
                    cor?: string
                    whatsapp?: string | null
                    instagram?: string | null
                    endereco?: string | null
                    horario?: string | null
                    aberta?: boolean
                    aviso?: string | null
                    aceita_entrega?: boolean
                    aceita_retirada?: boolean
                    taxa_entrega?: number
                    frete_gratis_acima?: number | null
                    pedido_minimo?: number
                    formas_pagamento?: FormaPagamento[]
                    chave_pix?: string | null
                    atualizado_em?: string
                }
                Relationships: []
            }
            categorias: {
                Row: {
                    id: string
                    nome: string
                    slug: string
                    ordem: number
                    criado_em: string
                }
                Insert: {
                    id?: string
                    nome: string
                    slug: string
                    ordem?: number
                    criado_em?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    slug?: string
                    ordem?: number
                    criado_em?: string
                }
                Relationships: []
            }
            produtos: {
                Row: {
                    id: string
                    categoria_id: string | null
                    nome: string
                    slug: string
                    descricao: string | null
                    fotos: string[]
                    rotulo_variacao: string | null
                    destaque: boolean
                    ativo: boolean
                    ordem: number
                    criado_em: string
                    atualizado_em: string
                }
                Insert: {
                    id?: string
                    categoria_id?: string | null
                    nome: string
                    slug: string
                    descricao?: string | null
                    fotos?: string[]
                    rotulo_variacao?: string | null
                    destaque?: boolean
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Update: {
                    id?: string
                    categoria_id?: string | null
                    nome?: string
                    slug?: string
                    descricao?: string | null
                    fotos?: string[]
                    rotulo_variacao?: string | null
                    destaque?: boolean
                    ativo?: boolean
                    ordem?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "produtos_categoria_id_fkey"
                        columns: ["categoria_id"]
                        isOneToOne: false
                        referencedRelation: "categorias"
                        referencedColumns: ["id"]
                    },
                ]
            }
            produto_variacoes: {
                Row: {
                    id: string
                    produto_id: string
                    rotulo: string
                    preco: number
                    preco_de: number | null
                    estoque: number | null
                    ativo: boolean
                    ordem: number
                }
                Insert: {
                    id?: string
                    produto_id: string
                    rotulo?: string
                    preco: number
                    preco_de?: number | null
                    estoque?: number | null
                    ativo?: boolean
                    ordem?: number
                }
                Update: {
                    id?: string
                    produto_id?: string
                    rotulo?: string
                    preco?: number
                    preco_de?: number | null
                    estoque?: number | null
                    ativo?: boolean
                    ordem?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "produto_variacoes_produto_id_fkey"
                        columns: ["produto_id"]
                        isOneToOne: false
                        referencedRelation: "produtos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            pedidos: {
                Row: {
                    id: string
                    numero: number
                    cliente_id: string | null
                    status: PedidoStatus
                    tipo_entrega: TipoEntrega
                    cliente_nome: string
                    cliente_telefone: string
                    endereco: Endereco | null
                    forma_pagamento: FormaPagamento
                    troco_para: number | null
                    observacoes: string | null
                    itens: PedidoItem[]
                    subtotal: number
                    taxa_entrega: number
                    total: number
                    criado_em: string
                    atualizado_em: string
                }
                Insert: {
                    id?: string
                    cliente_id?: string | null
                    status?: PedidoStatus
                    tipo_entrega: TipoEntrega
                    cliente_nome: string
                    cliente_telefone: string
                    endereco?: EnderecoInput | null
                    forma_pagamento: FormaPagamento
                    troco_para?: number | null
                    observacoes?: string | null
                    /** O navegador manda só variação e quantidade; o `pedidos_criar` reescreve. */
                    itens: PedidoItemInput[]
                    subtotal?: number
                    taxa_entrega?: number
                    total?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Update: {
                    id?: string
                    cliente_id?: string | null
                    status?: PedidoStatus
                    tipo_entrega?: TipoEntrega
                    cliente_nome?: string
                    cliente_telefone?: string
                    endereco?: EnderecoInput | null
                    forma_pagamento?: FormaPagamento
                    troco_para?: number | null
                    observacoes?: string | null
                    itens?: PedidoItem[]
                    subtotal?: number
                    taxa_entrega?: number
                    total?: number
                    criado_em?: string
                    atualizado_em?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "pedidos_cliente_id_fkey"
                        columns: ["cliente_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: Record<never, never>
        Functions: {
            papel_atual: { Args: Record<PropertyKey, never>; Returns: string }
            is_equipe: { Args: Record<PropertyKey, never>; Returns: boolean }
            is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
            formatar_real: { Args: { valor: number }; Returns: string }
            max_pedidos_abertos: { Args: Record<PropertyKey, never>; Returns: number }
        }
        Enums: Record<never, never>
        CompositeTypes: Record<never, never>
    }
}
