export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: Json
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      credit_note_items: {
        Row: {
          created_at: string
          credit_note_id: string
          id: string
          invoice_item_id: string | null
          is_service: boolean
          product_id: string
          product_name: string
          quantity: number
          restore_batch_id: string | null
          restored_to_stock: boolean
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          credit_note_id: string
          id?: string
          invoice_item_id?: string | null
          is_service?: boolean
          product_id: string
          product_name: string
          quantity: number
          restore_batch_id?: string | null
          restored_to_stock?: boolean
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          credit_note_id?: string
          id?: string
          invoice_item_id?: string | null
          is_service?: boolean
          product_id?: string
          product_name?: string
          quantity?: number
          restore_batch_id?: string | null
          restored_to_stock?: boolean
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_note_items_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          created_at: string
          created_by: string | null
          credit_note_number: string
          customer_id: string
          id: string
          invoice_id: string
          last_reprinted_at: string | null
          reason: string | null
          refund_amount: number
          refund_method: Database["public"]["Enums"]["credit_note_refund_method"]
          reprint_count: number
          status: Database["public"]["Enums"]["credit_note_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_note_number?: string
          customer_id: string
          id?: string
          invoice_id: string
          last_reprinted_at?: string | null
          reason?: string | null
          refund_amount?: number
          refund_method?: Database["public"]["Enums"]["credit_note_refund_method"]
          reprint_count?: number
          status?: Database["public"]["Enums"]["credit_note_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_note_number?: string
          customer_id?: string
          id?: string
          invoice_id?: string
          last_reprinted_at?: string | null
          reason?: string | null
          refund_amount?: number
          refund_method?: Database["public"]["Enums"]["credit_note_refund_method"]
          reprint_count?: number
          status?: Database["public"]["Enums"]["credit_note_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          credit_terms: number
          current_balance: number
          customer_code: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          debt_limit: number
          email: string | null
          id: string
          is_suspended: boolean
          kra_pin: string | null
          location: string | null
          name: string
          phone: string | null
          total_spent: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          credit_terms?: number
          current_balance?: number
          customer_code?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          debt_limit?: number
          email?: string | null
          id?: string
          is_suspended?: boolean
          kra_pin?: string | null
          location?: string | null
          name: string
          phone?: string | null
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          credit_terms?: number
          current_balance?: number
          customer_code?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          debt_limit?: number
          email?: string | null
          id?: string
          is_suspended?: boolean
          kra_pin?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          journal_id: string | null
          payment_account_id: string | null
          status: string
          supplier_id: string | null
          vat_amount: number
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          journal_id?: string | null
          payment_account_id?: string | null
          status?: string
          supplier_id?: string | null
          vat_amount?: number
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          journal_id?: string | null
          payment_account_id?: string | null
          status?: string
          supplier_id?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "expenses_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          batch_id: string | null
          cogs: number
          created_at: string
          discount: number
          id: string
          invoice_id: string
          product_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          cogs?: number
          created_at?: string
          discount?: number
          id?: string
          invoice_id: string
          product_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          batch_id?: string | null
          cogs?: number
          created_at?: string
          discount?: number
          id?: string
          invoice_id?: string
          product_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approval_reason: string | null
          approval_status: string
          balance: number
          cash_amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          etims_error: string | null
          etims_qr_data: string | null
          etims_signature: string | null
          etims_status: Database["public"]["Enums"]["etims_status"]
          etims_synced_at: string | null
          id: string
          invoice_number: string
          last_reprinted_at: string | null
          mpesa_amount: number
          paid_amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          reprint_count: number
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          approval_reason?: string | null
          approval_status?: string
          balance?: number
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          etims_error?: string | null
          etims_qr_data?: string | null
          etims_signature?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status"]
          etims_synced_at?: string | null
          id?: string
          invoice_number?: string
          last_reprinted_at?: string | null
          mpesa_amount?: number
          paid_amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reprint_count?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          approval_reason?: string | null
          approval_status?: string
          balance?: number
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          etims_error?: string | null
          etims_qr_data?: string | null
          etims_signature?: string | null
          etims_status?: Database["public"]["Enums"]["etims_status"]
          etims_synced_at?: string | null
          id?: string
          invoice_number?: string
          last_reprinted_at?: string | null
          mpesa_amount?: number
          paid_amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reprint_count?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          is_reversal: boolean
          reference_id: string | null
          reference_type: string | null
          reverses_id: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          is_reversal?: boolean
          reference_id?: string | null
          reference_type?: string | null
          reverses_id?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          is_reversal?: boolean
          reference_id?: string | null
          reference_type?: string | null
          reverses_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_reverses_id_fkey"
            columns: ["reverses_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          id: string
          journal_id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_id: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "journal_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cash_amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          invoice_id: string
          mpesa_amount: number
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          invoice_id: string
          mpesa_amount?: number
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string
          mpesa_amount?: number
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: number
          old_value: number
          product_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value: number
          old_value: number
          product_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: number
          old_value?: number
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_sell_price: number
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          floor_price: number
          id: string
          image_url: string | null
          is_service: boolean
          min_stock: number
          name: string
          shop_featured: boolean
          shop_visible: boolean
          tax_category: Database["public"]["Enums"]["tax_category"]
          unit: string
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          base_sell_price?: number
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          floor_price?: number
          id?: string
          image_url?: string | null
          is_service?: boolean
          min_stock?: number
          name: string
          shop_featured?: boolean
          shop_visible?: boolean
          tax_category?: Database["public"]["Enums"]["tax_category"]
          unit?: string
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          base_sell_price?: number
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          floor_price?: number
          id?: string
          image_url?: string | null
          is_service?: boolean
          min_stock?: number
          name?: string
          shop_featured?: boolean
          shop_visible?: boolean
          tax_category?: Database["public"]["Enums"]["tax_category"]
          unit?: string
          updated_at?: string
          vat_rate?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          failed_login_attempts: number
          id: string
          is_locked: boolean
          locked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          failed_login_attempts?: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          failed_login_attempts?: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          batch_id: string | null
          created_at: string
          description: string | null
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          total: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_id: string
          purchase_id: string
          quantity: number
          total: number
          unit_cost: number
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          total?: number
          unit_cost?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          line_total: number
          po_id: string
          product_id: string | null
          quantity: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          line_total?: number
          po_id: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          line_total?: number
          po_id?: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          reference: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
          vat_total: number
          wht_total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
          vat_total?: number
          wht_total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
          vat_total?: number
          wht_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          purchase_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type: string
          purchase_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          purchase_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          payment_mode: Database["public"]["Enums"]["purchase_payment_mode"]
          payment_terms_days: number | null
          po_id: string | null
          posted_at: string | null
          purchase_code: string
          purchase_date: string
          reference: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          subtotal: number
          supplier_id: string
          total: number
          vat_total: number
          wht_total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["purchase_payment_mode"]
          payment_terms_days?: number | null
          po_id?: string | null
          posted_at?: string | null
          purchase_code?: string
          purchase_date?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          vat_total?: number
          wht_total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["purchase_payment_mode"]
          payment_terms_days?: number | null
          po_id?: string | null
          posted_at?: string | null
          purchase_code?: string
          purchase_date?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          vat_total?: number
          wht_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_inquiries: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          service_key: string
          service_name: string
          source: string
          status: string
          updated_at: string
          user_id: string | null
          whatsapp_message: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          service_key: string
          service_name: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_message?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          service_key?: string
          service_name?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          erp_customer_id: string | null
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          erp_customer_id?: string | null
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          erp_customer_id?: string | null
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          id: string
          invoice_id: string | null
          mpesa_checkout_request_id: string | null
          mpesa_phone: string | null
          mpesa_receipt: string | null
          notes: string | null
          order_number: string
          shop_customer_id: string | null
          status: Database["public"]["Enums"]["shop_order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          id?: string
          invoice_id?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_phone?: string | null
          mpesa_receipt?: string | null
          notes?: string | null
          order_number?: string
          shop_customer_id?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          id?: string
          invoice_id?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_phone?: string | null
          mpesa_receipt?: string | null
          notes?: string | null
          order_number?: string
          shop_customer_id?: string | null
          status?: Database["public"]["Enums"]["shop_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_shop_customer_id_fkey"
            columns: ["shop_customer_id"]
            isOneToOne: false
            referencedRelation: "shop_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_batches: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          product_id: string
          purchase_date: string
          quantity_bought: number
          quantity_remaining: number
          supplier_id: string | null
        }
        Insert: {
          cost_price?: number
          created_at?: string
          id?: string
          product_id: string
          purchase_date?: string
          quantity_bought?: number
          quantity_remaining?: number
          supplier_id?: string | null
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          product_id?: string
          purchase_date?: string
          quantity_bought?: number
          quantity_remaining?: number
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kra_pin: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kra_pin?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kra_pin?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wifi_transactions: {
        Row: {
          amount: number
          authenticated_at: string | null
          client_mac: string | null
          created_at: string
          id: string
          journal_id: string | null
          mpesa_receipt: string | null
          package_type: string | null
          paid_at: string
          phone_number: string | null
          remote_id: string
          ssid: string | null
          status: string
          synced_at: string
          voucher_code: string | null
        }
        Insert: {
          amount?: number
          authenticated_at?: string | null
          client_mac?: string | null
          created_at?: string
          id?: string
          journal_id?: string | null
          mpesa_receipt?: string | null
          package_type?: string | null
          paid_at?: string
          phone_number?: string | null
          remote_id: string
          ssid?: string | null
          status?: string
          synced_at?: string
          voucher_code?: string | null
        }
        Update: {
          amount?: number
          authenticated_at?: string | null
          client_mac?: string | null
          created_at?: string
          id?: string
          journal_id?: string | null
          mpesa_receipt?: string | null
          package_type?: string | null
          paid_at?: string
          phone_number?: string | null
          remote_id?: string
          ssid?: string | null
          status?: string
          synced_at?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      wifi_vouchers: {
        Row: {
          code: string | null
          created_at: string
          duration_hours: number | null
          id: string
          package_type: string | null
          remote_id: string
          status: string | null
          synced_at: string
          used_at: string | null
          used_by_mac: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          package_type?: string | null
          remote_id: string
          status?: string | null
          synced_at?: string
          used_at?: string | null
          used_by_mac?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          package_type?: string | null
          remote_id?: string
          status?: string | null
          synced_at?: string
          used_at?: string | null
          used_by_mac?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_trial_balance: {
        Row: {
          account_id: string | null
          balance: number | null
          code: string | null
          name: string | null
          total_credit: number | null
          total_debit: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      convert_po_to_invoice: { Args: { p_po_id: string }; Returns: string }
      create_credit_note: {
        Args: {
          p_invoice_id: string
          p_items: Json
          p_reason: string
          p_refund_method: Database["public"]["Enums"]["credit_note_refund_method"]
        }
        Returns: string
      }
      deduct_stock_fifo: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: number
      }
      get_product_stock: { Args: { p_product_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invoice_net: {
        Args: { p_subtotal: number; p_tax: number; p_total: number }
        Returns: number
      }
      map_expense_category_to_account: {
        Args: { p_cat: string }
        Returns: string
      }
      mark_credit_note_reprint: { Args: { p_id: string }; Returns: number }
      post_credit_note_journal: { Args: { p_cn_id: string }; Returns: string }
      post_journal: {
        Args: {
          p_description: string
          p_entry_date?: string
          p_lines: Json
          p_reference_id: string
          p_reference_type: string
        }
        Returns: string
      }
      post_purchase: { Args: { p_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "sales_agent"
      credit_note_refund_method:
        | "none"
        | "credit_balance"
        | "cash_refund"
        | "mpesa_refund"
      credit_note_status: "issued" | "void"
      customer_type: "walk_in" | "regular"
      etims_status: "not_required" | "pending_sync" | "signed" | "failed"
      invoice_status: "paid" | "partial" | "unpaid"
      payment_method: "cash" | "mpesa" | "cash_mpesa" | "partial_debt"
      product_category:
        | "Phone Accessories"
        | "Internet Services"
        | "Printing Services"
        | "Other Services"
      purchase_order_status:
        | "draft"
        | "issued"
        | "received"
        | "cancelled"
        | "invoiced"
      purchase_payment_mode: "credit" | "cash" | "mpesa" | "bank"
      purchase_status: "draft" | "posted" | "cancelled"
      shop_order_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "fulfilled"
      tax_category: "standard" | "zero_rated" | "exempt"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sales_agent"],
      credit_note_refund_method: [
        "none",
        "credit_balance",
        "cash_refund",
        "mpesa_refund",
      ],
      credit_note_status: ["issued", "void"],
      customer_type: ["walk_in", "regular"],
      etims_status: ["not_required", "pending_sync", "signed", "failed"],
      invoice_status: ["paid", "partial", "unpaid"],
      payment_method: ["cash", "mpesa", "cash_mpesa", "partial_debt"],
      product_category: [
        "Phone Accessories",
        "Internet Services",
        "Printing Services",
        "Other Services",
      ],
      purchase_order_status: [
        "draft",
        "issued",
        "received",
        "cancelled",
        "invoiced",
      ],
      purchase_payment_mode: ["credit", "cash", "mpesa", "bank"],
      purchase_status: ["draft", "posted", "cancelled"],
      shop_order_status: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "fulfilled",
      ],
      tax_category: ["standard", "zero_rated", "exempt"],
    },
  },
} as const
