// src/types/database.types.ts
// Généré manuellement, aligné sur les migrations (dont 0004, 0009, 0011_cleanup_enums_and_contacts)

export interface Database {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string
          name: string
          finess: string | null
          address: string | null
          logo_url: string | null
          created_at: string
          address_latitude: number | null
          address_longitude: number | null
          address_geocoded_at: string | null
          clockin_geofence_enabled: boolean
          clockin_geofence_radius_m: number
        }
        Insert: {
          id?: string
          name: string
          finess?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
          address_latitude?: number | null
          address_longitude?: number | null
          address_geocoded_at?: string | null
          clockin_geofence_enabled?: boolean
          clockin_geofence_radius_m?: number
        }
        Update: {
          name?: string
          finess?: string | null
          address?: string | null
          logo_url?: string | null
          address_latitude?: number | null
          address_longitude?: number | null
          address_geocoded_at?: string | null
          clockin_geofence_enabled?: boolean
          clockin_geofence_radius_m?: number
        }
      }
      profiles: {
        Row: {
          id: string
          pharmacy_id: string | null
          role: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
          first_name: string | null
          last_name: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          missions_dismissed_at: string | null
        }
        Insert: {
          id: string
          pharmacy_id?: string | null
          role?: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          missions_dismissed_at?: string | null
        }
        Update: {
          pharmacy_id?: string | null
          role?: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          missions_dismissed_at?: string | null
        }
      }
      invitations: {
        Row: {
          id: string
          pharmacy_id: string
          email: string
          role: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
          token: string
          token_hash: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          email: string
          role?: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
          token?: string
          token_hash?: string | null
          accepted_at?: string | null
          expires_at?: string
        }
        Update: {
          accepted_at?: string | null
          token_hash?: string | null
          expires_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          pharmacy_id: string
          user_id: string
          type: 'task_assigned' | 'shortage_reported'
          title: string
          body: string | null
          read_at: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          user_id: string
          type: 'task_assigned' | 'shortage_reported'
          title: string
          body?: string | null
          read_at?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
          title?: string
          body?: string | null
          metadata?: Record<string, unknown> | null
        }
      }
      work_sessions: {
        Row: {
          id: string
          user_id: string
          pharmacy_id: string
          started_at: string
          ended_at: string | null
          tasks_completed: number
          worked_minutes_accumulated: number
          current_segment_started_at: string | null
          created_at: string
          clockin_latitude: number | null
          clockin_longitude: number | null
          clockin_accuracy_m: number | null
          clockin_distance_m: number | null
        }
        Insert: {
          id?: string
          user_id: string
          pharmacy_id: string
          started_at?: string
          ended_at?: string | null
          tasks_completed?: number
          worked_minutes_accumulated?: number
          current_segment_started_at?: string | null
          clockin_latitude?: number | null
          clockin_longitude?: number | null
          clockin_accuracy_m?: number | null
          clockin_distance_m?: number | null
        }
        Update: {
          ended_at?: string | null
          tasks_completed?: number
          worked_minutes_accumulated?: number
          current_segment_started_at?: string | null
          clockin_latitude?: number | null
          clockin_longitude?: number | null
          clockin_accuracy_m?: number | null
          clockin_distance_m?: number | null
        }
      }
      tasks: {
        Row: {
          id: string
          pharmacy_id: string
          created_by: string
          assigned_to: string | null
          title: string
          description: string | null
          status: 'todo' | 'done' | 'cancelled'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          completed_at: string | null
          audio_url: string | null
          attachments: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          created_by: string
          assigned_to?: string | null
          title: string
          description?: string | null
          status?: 'todo' | 'done' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          completed_at?: string | null
          audio_url?: string | null
          attachments?: unknown
        }
        Update: {
          assigned_to?: string | null
          title?: string
          description?: string | null
          status?: 'todo' | 'done' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          completed_at?: string | null
          audio_url?: string | null
          attachments?: unknown
        }
      }
      prescriptions: {
        Row: {
          id: string
          pharmacy_id: string
          created_by: string | null
          image_url: string | null
          patient_ref: string | null
          prescriber_name: string | null
          prescribed_date: string | null
          expiry_date: string | null
          status: 'to_serve' | 'served' | 'expired' | 'on_hold'
          priority: 'low' | 'medium' | 'high'
          execution_date: string | null
          missing_products: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          created_by?: string | null
          image_url?: string | null
          patient_ref?: string | null
          prescriber_name?: string | null
          prescribed_date?: string | null
          expiry_date?: string | null
          status?: 'to_serve' | 'served' | 'expired' | 'on_hold'
          priority?: 'low' | 'medium' | 'high'
          execution_date?: string | null
          missing_products?: string | null
          notes?: string | null
        }
        Update: {
          image_url?: string | null
          patient_ref?: string | null
          prescriber_name?: string | null
          prescribed_date?: string | null
          expiry_date?: string | null
          status?: 'to_serve' | 'served' | 'expired' | 'on_hold'
          priority?: 'low' | 'medium' | 'high'
          execution_date?: string | null
          missing_products?: string | null
          notes?: string | null
        }
      }
      prescription_comments: {
        Row: {
          id: string
          prescription_id: string
          pharmacy_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          pharmacy_id: string
          author_id: string
          content: string
        }
        Update: {
          content?: string
        }
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          pharmacy_id: string
          medication_name: string
          dosage: string | null
          quantity: number
          status: string
          substitute: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          pharmacy_id: string
          medication_name: string
          dosage?: string | null
          quantity: number
          status?: string
          substitute?: string | null
          created_at?: string
        }
        Update: {
          medication_name?: string
          dosage?: string | null
          quantity?: number
          status?: string
          substitute?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          pharmacy_id: string
          created_by: string
          name: string
          company: string | null
          role: string | null
          category: string
          phone: string | null
          email: string | null
          address: string | null
          website: string | null
          reference: string | null
          notes: string | null
          is_urgent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          created_by: string
          name: string
          company?: string | null
          role?: string | null
          category: string
          phone?: string | null
          email?: string | null
          address?: string | null
          website?: string | null
          reference?: string | null
          notes?: string | null
          is_urgent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          company?: string | null
          role?: string | null
          category?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          website?: string | null
          reference?: string | null
          notes?: string | null
          is_urgent?: boolean
        }
      }
      suppliers: {
        Row: {
          id: string
          pharmacy_id: string
          name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          pharmacy_id: string
          supplier_id: string | null
          created_by: string
          status: 'draft' | 'sent' | 'received'
          notes: string | null
          ordered_at: string | null
          received_at: string | null
          attachments: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          supplier_id?: string | null
          created_by: string
          status?: 'draft' | 'sent' | 'received'
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          attachments?: any | null
        }
        Update: {
          supplier_id?: string | null
          status?: 'draft' | 'sent' | 'received'
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          attachments?: any | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          pharmacy_id: string
          product_name: string
          quantity: number
          unit_price: number | null
          is_shortage: boolean
        }
        Insert: {
          id?: string
          order_id: string
          pharmacy_id: string
          product_name: string
          quantity: number
          unit_price?: number | null
          is_shortage?: boolean
        }
        Update: {
          product_name?: string
          quantity?: number
          unit_price?: number | null
          is_shortage?: boolean
        }
      }
      rentals: {
        Row: {
          id: string
          pharmacy_id: string
          created_by: string
          client_name: string
          client_phone: string | null
          equipment: string
          status: 'active' | 'returned' | 'overdue'
          started_at: string
          expected_return: string
          returned_at: string | null
          deposit: number | null
          daily_rate: number | null
          billing_type: 'daily' | 'weekly' | 'monthly'
          paid_units: number
          total_units: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          created_by: string
          client_name: string
          client_phone?: string | null
          equipment: string
          status?: 'active' | 'returned' | 'overdue'
          started_at: string
          expected_return: string
          returned_at?: string | null
          deposit?: number | null
          daily_rate?: number | null
          billing_type?: 'daily' | 'weekly' | 'monthly'
          paid_units?: number
          total_units?: number
          notes?: string | null
        }
        Update: {
          client_name?: string
          client_phone?: string | null
          equipment?: string
          status?: 'active' | 'returned' | 'overdue'
          started_at?: string
          expected_return?: string
          returned_at?: string | null
          deposit?: number | null
          daily_rate?: number | null
          billing_type?: 'daily' | 'weekly' | 'monthly'
          paid_units?: number
          total_units?: number
          notes?: string | null
        }
      }
      rental_attachments: {
        Row: {
          id: string
          rental_id: string
          pharmacy_id: string
          storage_path: string
          mime_type: string
          size_bytes: number
          original_filename: string | null
          captured_at: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rental_id: string
          pharmacy_id: string
          storage_path: string
          mime_type: string
          size_bytes: number
          original_filename?: string | null
          captured_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          original_filename?: string | null
          captured_at?: string | null
        }
      }
      shortages: {
        Row: {
          id: string
          pharmacy_id: string
          reported_by: string
          resolved_by: string | null
          drug_shortage_id: string | null
          product_name: string
          status: 'open' | 'substitute_found' | 'resolved'
          substitute: string | null
          notes: string | null
          resolved_at: string | null
          resolution_cip13: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          reported_by: string
          resolved_by?: string | null
          drug_shortage_id?: string | null
          product_name: string
          status?: 'open' | 'substitute_found' | 'resolved'
          substitute?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolution_cip13?: string | null
        }
        Update: {
          resolved_by?: string | null
          drug_shortage_id?: string | null
          product_name?: string
          status?: 'open' | 'substitute_found' | 'resolved'
          substitute?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolution_cip13?: string | null
        }
      }
      training_resources: {
        Row: {
          id: string
          pharmacy_id: string
          created_by: string
          title: string
          description: string | null
          type: 'video' | 'memo'
          url: string | null
          storage_path: string | null
          duration_minutes: number | null
          is_published: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          created_by: string
          title: string
          description?: string | null
          type: 'video' | 'memo'
          url?: string | null
          storage_path?: string | null
          duration_minutes?: number | null
          is_published?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          type?: 'video' | 'memo'
          url?: string | null
          storage_path?: string | null
          duration_minutes?: number | null
          is_published?: boolean
          order_index?: number
        }
      }
      drug_shortages: {
        Row: {
          id: string
          cis: string
          cip13: string | null
          medication_name: string | null
          type: string | null
          started_at: string | null
          ends_at: string | null
          ansm_url: string | null
          imported_at: string
        }
        Insert: {
          id?: string
          cis: string
          cip13?: string | null
          medication_name?: string | null
          type?: string | null
          started_at?: string | null
          ends_at?: string | null
          ansm_url?: string | null
          imported_at?: string
        }
        Update: {
          cis?: string
          cip13?: string | null
          medication_name?: string | null
          type?: string | null
          started_at?: string | null
          ends_at?: string | null
          ansm_url?: string | null
          imported_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          pharmacy_id: string
          user_id: string
          action: string
          target_type: string
          target_id: string | null
          metadata: Record<string, unknown>
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          user_id: string
          action: string
          target_type: string
          target_id?: string | null
          metadata?: Record<string, unknown>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          action?: string
          target_type?: string
          target_id?: string | null
          metadata?: Record<string, unknown>
        }
      }
      feedback: {
        Row: {
          id: string
          pharmacy_id: string | null
          user_id: string | null
          category: 'bug' | 'idea' | 'praise' | 'other'
          content: string
          page_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id?: string | null
          user_id?: string | null
          category: 'bug' | 'idea' | 'praise' | 'other'
          content: string
          page_url?: string | null
          created_at?: string
        }
        Update: {
          pharmacy_id?: string | null
          category?: 'bug' | 'idea' | 'praise' | 'other'
          content?: string
          page_url?: string | null
        }
      }
      leave_requests: {
        Row: {
          id: string
          pharmacy_id: string
          requester_id: string
          leave_type: 'cp' | 'rtt' | 'sick' | 'training' | 'public_holiday' | 'unpaid' | 'other'
          start_date: string
          end_date: string
          half_day_start: boolean
          half_day_end: boolean
          reason: string | null
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          requester_id: string
          leave_type: 'cp' | 'rtt' | 'sick' | 'training' | 'public_holiday' | 'unpaid' | 'other'
          start_date: string
          end_date: string
          half_day_start?: boolean
          half_day_end?: boolean
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          leave_type?: 'cp' | 'rtt' | 'sick' | 'training' | 'public_holiday' | 'unpaid' | 'other'
          start_date?: string
          end_date?: string
          half_day_start?: boolean
          half_day_end?: boolean
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          updated_at?: string
        }
      }
      chat_channels: {
        Row: {
          id: string
          pharmacy_id: string
          slug: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          slug: string
          name: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          slug?: string
          name?: string
          is_default?: boolean
        }
      }
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          pharmacy_id: string
          author_id: string | null
          body: string
          edited_at: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          pharmacy_id: string
          author_id?: string | null
          body: string
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          body?: string
          edited_at?: string | null
          deleted_at?: string | null
        }
      }
      chat_read_states: {
        Row: {
          user_id: string
          channel_id: string
          pharmacy_id: string
          last_read_at: string
        }
        Insert: {
          user_id: string
          channel_id: string
          pharmacy_id: string
          last_read_at?: string
        }
        Update: {
          last_read_at?: string
        }
      }
      weekly_schedules: {
        Row: {
          id: string
          pharmacy_id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          active_from: string
          active_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          active_from: string
          active_until?: string | null
          created_at?: string
        }
        Update: {
          day_of_week?: number
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          active_from?: string
          active_until?: string | null
        }
      }
    }
    Enums: {
      user_role: 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
      task_status: 'todo' | 'done' | 'cancelled'
      task_priority: 'low' | 'medium' | 'high'
      order_status: 'draft' | 'sent' | 'received'
      prescription_status: 'to_serve' | 'served' | 'expired' | 'on_hold'
      rental_billing_type: 'daily' | 'weekly' | 'monthly'
      rental_status: 'active' | 'returned' | 'overdue'
      shortage_status: 'open' | 'substitute_found' | 'resolved'
      training_resource_type: 'video' | 'memo'
    }
  }
}