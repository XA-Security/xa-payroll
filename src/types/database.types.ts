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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_requests: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          supervisor_name: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supervisor_name: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supervisor_name?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      action_results: {
        Row: {
          action_type: string
          affected_resource: string | null
          affected_user_id: string | null
          affected_user_name: string | null
          api_endpoint: string | null
          api_service: string | null
          command_args: Json | null
          command_text: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          duration_ms: number | null
          error_message: string | null
          http_method: string | null
          http_status: number | null
          id: string
          message_id: number | null
          request_payload: Json | null
          response_payload: Json | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          affected_resource?: string | null
          affected_user_id?: string | null
          affected_user_name?: string | null
          api_endpoint?: string | null
          api_service?: string | null
          command_args?: Json | null
          command_text: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          http_method?: string | null
          http_status?: number | null
          id?: string
          message_id?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          affected_resource?: string | null
          affected_user_id?: string | null
          affected_user_name?: string | null
          api_endpoint?: string | null
          api_service?: string | null
          command_args?: Json | null
          command_text?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          http_method?: string | null
          http_status?: number | null
          id?: string
          message_id?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_results_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "Threads"
            referencedColumns: ["id"]
          },
        ]
      }
      adp_sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          created_workers: number | null
          current_offset: number | null
          error_count: number | null
          error_message: string | null
          id: string
          integration_id: string
          invocation_count: number | null
          last_page_fetched: number | null
          next_invocation_scheduled_at: string | null
          processed_workers: number | null
          skipped_workers: number | null
          started_at: string | null
          status: string
          sync_limit: number | null
          sync_mode: string
          total_workers: number | null
          updated_at: string | null
          updated_workers: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_workers?: number | null
          current_offset?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          integration_id: string
          invocation_count?: number | null
          last_page_fetched?: number | null
          next_invocation_scheduled_at?: string | null
          processed_workers?: number | null
          skipped_workers?: number | null
          started_at?: string | null
          status?: string
          sync_limit?: number | null
          sync_mode: string
          total_workers?: number | null
          updated_at?: string | null
          updated_workers?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_workers?: number | null
          current_offset?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          integration_id?: string
          invocation_count?: number | null
          last_page_fetched?: number | null
          next_invocation_scheduled_at?: string | null
          processed_workers?: number | null
          skipped_workers?: number | null
          started_at?: string | null
          status?: string
          sync_limit?: number | null
          sync_mode?: string
          total_workers?: number | null
          updated_at?: string | null
          updated_workers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adp_sync_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adp_sync_jobs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      adp_validation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error_count: number
          error_message: string | null
          id: string
          invalid_count: number
          run_timestamp: string | null
          status: string | null
          total_checked: number
          updated_at: string | null
          valid_count: number
          validation_run_id: string
          warning_count: number
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_count?: number
          error_message?: string | null
          id?: string
          invalid_count?: number
          run_timestamp?: string | null
          status?: string | null
          total_checked?: number
          updated_at?: string | null
          valid_count?: number
          validation_run_id: string
          warning_count?: number
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_count?: number
          error_message?: string | null
          id?: string
          invalid_count?: number
          run_timestamp?: string | null
          status?: string | null
          total_checked?: number
          updated_at?: string | null
          valid_count?: number
          validation_run_id?: string
          warning_count?: number
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          parent_message_id: string | null
          role: string
          thread_id: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_message_id?: string | null
          role: string
          thread_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_message_id?: string | null
          role?: string
          thread_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "agent_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_threads: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string | null
          id: string
          langgraph_checkpoint_id: string | null
          last_message_at: string | null
          metadata: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string | null
          id?: string
          langgraph_checkpoint_id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          langgraph_checkpoint_id?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_threads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          input_payload: Json | null
          message_id: string | null
          output_payload: Json | null
          started_at: string | null
          status: string | null
          thread_id: string
          tool_name: string
          tool_type: string | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_payload?: Json | null
          message_id?: string | null
          output_payload?: Json | null
          started_at?: string | null
          status?: string | null
          thread_id: string
          tool_name: string
          tool_type?: string | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_payload?: Json | null
          message_id?: string | null
          output_payload?: Json | null
          started_at?: string | null
          status?: string | null
          thread_id?: string
          tool_name?: string
          tool_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_executions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "agent_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_executions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_type: string
          available_tools: string[] | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          model_config: Json | null
          name: string
          permissions_required: string[] | null
          system_prompt_path: string | null
          updated_at: string | null
        }
        Insert: {
          agent_type: string
          available_tools?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          model_config?: Json | null
          name: string
          permissions_required?: string[] | null
          system_prompt_path?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          available_tools?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          model_config?: Json | null
          name?: string
          permissions_required?: string[] | null
          system_prompt_path?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      annual_hours_eval_jobs: {
        Row: {
          adp_error: string | null
          adp_status: string | null
          adp_total_hours: number | null
          completed_at: string | null
          created_at: string | null
          end_date: string
          humanity_error: string | null
          humanity_records_processed: number | null
          humanity_status: string | null
          humanity_total_hours: number | null
          humanity_total_records: number | null
          id: string
          qbo_error: string | null
          qbo_records_processed: number | null
          qbo_status: string | null
          qbo_total_hours: number | null
          qbo_total_records: number | null
          requested_by: string
          start_date: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          adp_error?: string | null
          adp_status?: string | null
          adp_total_hours?: number | null
          completed_at?: string | null
          created_at?: string | null
          end_date: string
          humanity_error?: string | null
          humanity_records_processed?: number | null
          humanity_status?: string | null
          humanity_total_hours?: number | null
          humanity_total_records?: number | null
          id?: string
          qbo_error?: string | null
          qbo_records_processed?: number | null
          qbo_status?: string | null
          qbo_total_hours?: number | null
          qbo_total_records?: number | null
          requested_by: string
          start_date: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          adp_error?: string | null
          adp_status?: string | null
          adp_total_hours?: number | null
          completed_at?: string | null
          created_at?: string | null
          end_date?: string
          humanity_error?: string | null
          humanity_records_processed?: number | null
          humanity_status?: string | null
          humanity_total_hours?: number | null
          humanity_total_records?: number | null
          id?: string
          qbo_error?: string | null
          qbo_records_processed?: number | null
          qbo_status?: string | null
          qbo_total_hours?: number | null
          qbo_total_records?: number | null
          requested_by?: string
          start_date?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annual_hours_eval_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_bookings: {
        Row: {
          asset_id: string
          booked_by: string
          created_at: string | null
          end_date: string | null
          end_time: string | null
          id: string
          notes: string | null
          start_date: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          booked_by: string
          created_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_date: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          booked_by?: string
          created_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_bookings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_deposits: {
        Row: {
          amount: number
          asset_id: string
          collected_by: string | null
          collected_date: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          refunded_by: string | null
          refunded_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          asset_id: string
          collected_by?: string | null
          collected_date?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          refunded_by?: string | null
          refunded_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string
          collected_by?: string | null
          collected_date?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          refunded_by?: string | null
          refunded_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_deposits_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_deposits_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_deposits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_deposits_refunded_by_fkey"
            columns: ["refunded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_photos: {
        Row: {
          asset_id: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          asset_id: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          asset_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_photos_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transactions: {
        Row: {
          action: string
          asset_id: string
          condition_rating: number | null
          created_at: string | null
          damage_notes: string | null
          employee_id: string
          id: string
          location: string | null
          notes: string | null
          performed_by: string
          photos: string[] | null
          transaction_date: string | null
        }
        Insert: {
          action: string
          asset_id: string
          condition_rating?: number | null
          created_at?: string | null
          damage_notes?: string | null
          employee_id: string
          id?: string
          location?: string | null
          notes?: string | null
          performed_by: string
          photos?: string[] | null
          transaction_date?: string | null
        }
        Update: {
          action?: string
          asset_id?: string
          condition_rating?: number | null
          created_at?: string | null
          damage_notes?: string | null
          employee_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          performed_by?: string
          photos?: string[] | null
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          deposit_amount: number | null
          id: string
          is_active: boolean | null
          name: string
          requires_deposit: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deposit_amount?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_deposit?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deposit_amount?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_deposit?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type_id: string
          brand_name: string | null
          condition_notes: string | null
          condition_rating: number | null
          created_at: string | null
          created_by: string | null
          current_assignee_id: string | null
          custom_data: Json | null
          division: string | null
          id: string
          identifier: string | null
          is_active: boolean | null
          last_activity_at: string | null
          name: string
          notes: string | null
          office_id: string | null
          photos: string[] | null
          purchase_date: string | null
          serial_number: string | null
          updated_at: string | null
          updated_by: string | null
          value: number | null
        }
        Insert: {
          asset_type_id: string
          brand_name?: string | null
          condition_notes?: string | null
          condition_rating?: number | null
          created_at?: string | null
          created_by?: string | null
          current_assignee_id?: string | null
          custom_data?: Json | null
          division?: string | null
          id?: string
          identifier?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          name: string
          notes?: string | null
          office_id?: string | null
          photos?: string[] | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Update: {
          asset_type_id?: string
          brand_name?: string | null
          condition_notes?: string | null
          condition_rating?: number | null
          created_at?: string | null
          created_by?: string | null
          current_assignee_id?: string | null
          custom_data?: Json | null
          division?: string | null
          id?: string
          identifier?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          name?: string
          notes?: string | null
          office_id?: string | null
          photos?: string[] | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_asset_type_id_fkey"
            columns: ["asset_type_id"]
            isOneToOne: false
            referencedRelation: "asset_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_items: {
        Row: {
          created_at: string | null
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          owner_id: string | null
          priority: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          priority?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          priority?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bill_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string
          bill_id: string
          created_at: string | null
          id: string
          notes: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          bill_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          bill_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_approvals_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_attachments: {
        Row: {
          bill_id: string
          created_at: string | null
          created_by: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_attachments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_audit_log: {
        Row: {
          action: string
          bill_id: string
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          action: string
          bill_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          action?: string
          bill_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_audit_log_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_line_items: {
        Row: {
          amount: number
          bill_id: string
          billable_status: string | null
          created_at: string | null
          customer_ref: Json | null
          description: string | null
          id: string
          is_approved: boolean | null
          line_num: number | null
          qbo_class_id: string | null
          qbo_class_name: string | null
          qbo_item_id: string | null
          qbo_item_name: string | null
          quantity: number | null
          rate: number | null
          sort_order: number | null
          tax_amount: number | null
          tax_code_ref: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          bill_id: string
          billable_status?: string | null
          created_at?: string | null
          customer_ref?: Json | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          line_num?: number | null
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          quantity?: number | null
          rate?: number | null
          sort_order?: number | null
          tax_amount?: number | null
          tax_code_ref?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          billable_status?: string | null
          created_at?: string | null
          customer_ref?: Json | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          line_num?: number | null
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          quantity?: number | null
          rate?: number | null
          sort_order?: number | null
          tax_amount?: number | null
          tax_code_ref?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          ap_account_ref: Json | null
          balance: number | null
          created_at: string | null
          created_by: string | null
          currency_ref: Json | null
          due_date: string | null
          id: string
          notes: string | null
          qbo_bill_id: string | null
          qbo_sync_token: string | null
          rejection_reason: string | null
          status: string
          total_amt: number
          txn_date: string
          updated_at: string | null
          vendor_id: string | null
          vendor_ref_name: string
          vendor_ref_value: string | null
        }
        Insert: {
          ap_account_ref?: Json | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_ref?: Json | null
          due_date?: string | null
          id?: string
          notes?: string | null
          qbo_bill_id?: string | null
          qbo_sync_token?: string | null
          rejection_reason?: string | null
          status?: string
          total_amt?: number
          txn_date: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_ref_name: string
          vendor_ref_value?: string | null
        }
        Update: {
          ap_account_ref?: Json | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_ref?: Json | null
          due_date?: string | null
          id?: string
          notes?: string | null
          qbo_bill_id?: string | null
          qbo_sync_token?: string | null
          rejection_reason?: string | null
          status?: string
          total_amt?: number
          txn_date?: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_ref_name?: string
          vendor_ref_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_email_tags: {
        Row: {
          candidate_email: string
          created_at: string
          id: string
          tag_name: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          created_at?: string
          id?: string
          tag_name: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          created_at?: string
          id?: string
          tag_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_account_cost_attachments: {
        Row: {
          cost_id: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          cost_id: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          cost_id?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_cost_attachments_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "client_account_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_account_costs: {
        Row: {
          amount: number
          category: string | null
          client_id: string
          cost_date: string
          created_at: string | null
          created_by: string | null
          created_via: string | null
          description: string
          id: string
          invoice_id: string | null
          invoiced_at: string | null
          is_invoiced: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          client_id: string
          cost_date: string
          created_at?: string | null
          created_by?: string | null
          created_via?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          is_invoiced?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string
          cost_date?: string
          created_at?: string | null
          created_by?: string | null
          created_via?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          is_invoiced?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_account_costs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_account_costs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      client_merge_history: {
        Row: {
          contacts_merged: number | null
          contracts_merged: number | null
          created_at: string | null
          duplicate_client_ids: string[]
          field_selections: Json
          id: string
          merged_by: string | null
          primary_client_id: string
          quotes_merged: number | null
        }
        Insert: {
          contacts_merged?: number | null
          contracts_merged?: number | null
          created_at?: string | null
          duplicate_client_ids: string[]
          field_selections: Json
          id?: string
          merged_by?: string | null
          primary_client_id: string
          quotes_merged?: number | null
        }
        Update: {
          contacts_merged?: number | null
          contracts_merged?: number | null
          created_at?: string | null
          duplicate_client_ids?: string[]
          field_selections?: Json
          id?: string
          merged_by?: string | null
          primary_client_id?: string
          quotes_merged?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_merge_history_merged_by_fkey"
            columns: ["merged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_merge_history_primary_client_id_fkey"
            columns: ["primary_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_rate_cards: {
        Row: {
          billable_rate: number
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          position_id: string
          updated_at: string | null
        }
        Insert: {
          billable_rate: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          position_id: string
          updated_at?: string | null
        }
        Update: {
          billable_rate?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          position_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_rate_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_rate_cards_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sync_logs: {
        Row: {
          client_id: string
          created_at: string | null
          error_message: string | null
          fields_changed: Json | null
          id: string
          integration_type: string
          request_payload: Json | null
          response_data: Json | null
          status: string
          sync_direction: string
          synced_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          error_message?: string | null
          fields_changed?: Json | null
          id?: string
          integration_type: string
          request_payload?: Json | null
          response_data?: Json | null
          status: string
          sync_direction: string
          synced_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          fields_changed?: Json | null
          id?: string
          integration_type?: string
          request_payload?: Json | null
          response_data?: Json | null
          status?: string
          sync_direction?: string
          synced_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_sync_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sync_logs_synced_by_fkey"
            columns: ["synced_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_type: string | null
          address_line_1: string | null
          address_line_2: string | null
          adp_id: string | null
          adp_last_synced_at: string | null
          adp_sync_status: string | null
          city: string | null
          client_code: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          credit_limit_approved_at: string | null
          credit_limit_approved_by: string | null
          currency: string | null
          default_payment_terms: string
          display_name: string | null
          email: string | null
          gst_number: string | null
          humanity_id: string | null
          humanity_last_synced_at: string | null
          humanity_sync_status: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          lat: string | null
          logo_url: string | null
          long: string | null
          merged_into_client_id: string | null
          name: string
          notes: string | null
          pays_overtime: boolean
          pays_stat_holidays: boolean
          phone: string | null
          plus_code: string | null
          positions: Json | null
          postal_code: string | null
          province: string | null
          qbo_id: string | null
          qbo_last_synced_at: string | null
          qbo_sync_status: string | null
          taxable: boolean
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          adp_id?: string | null
          adp_last_synced_at?: string | null
          adp_sync_status?: string | null
          city?: string | null
          client_code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_limit_approved_at?: string | null
          credit_limit_approved_by?: string | null
          currency?: string | null
          default_payment_terms?: string
          display_name?: string | null
          email?: string | null
          gst_number?: string | null
          humanity_id?: string | null
          humanity_last_synced_at?: string | null
          humanity_sync_status?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          lat?: string | null
          logo_url?: string | null
          long?: string | null
          merged_into_client_id?: string | null
          name: string
          notes?: string | null
          pays_overtime?: boolean
          pays_stat_holidays?: boolean
          phone?: string | null
          plus_code?: string | null
          positions?: Json | null
          postal_code?: string | null
          province?: string | null
          qbo_id?: string | null
          qbo_last_synced_at?: string | null
          qbo_sync_status?: string | null
          taxable?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          adp_id?: string | null
          adp_last_synced_at?: string | null
          adp_sync_status?: string | null
          city?: string | null
          client_code?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_limit_approved_at?: string | null
          credit_limit_approved_by?: string | null
          currency?: string | null
          default_payment_terms?: string
          display_name?: string | null
          email?: string | null
          gst_number?: string | null
          humanity_id?: string | null
          humanity_last_synced_at?: string | null
          humanity_sync_status?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          lat?: string | null
          logo_url?: string | null
          long?: string | null
          merged_into_client_id?: string | null
          name?: string
          notes?: string | null
          pays_overtime?: boolean
          pays_stat_holidays?: boolean
          phone?: string | null
          plus_code?: string | null
          positions?: Json | null
          postal_code?: string | null
          province?: string | null
          qbo_id?: string | null
          qbo_last_synced_at?: string | null
          qbo_sync_status?: string | null
          taxable?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_credit_limit_approved_by_fkey"
            columns: ["credit_limit_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_merged_into_client"
            columns: ["merged_into_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      Company: {
        Row: {
          active: boolean | null
          created_at: string
          gst_number: string | null
          id: number
          logo: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          gst_number?: string | null
          id?: number
          logo?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          gst_number?: string | null
          id?: number
          logo?: string | null
          name?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          client_id: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          job_title: string | null
          last_name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          client_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          client_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          contract_number: string
          created_at: string | null
          created_by: string | null
          docusign_envelope_id: string | null
          end_date: string | null
          estimate_id: string | null
          id: string
          is_recurring: boolean | null
          last_sent_at: string | null
          recurrence_type: string | null
          signed_at: string | null
          start_date: string | null
          status: string | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          docusign_envelope_id?: string | null
          end_date?: string | null
          estimate_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          recurrence_type?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          docusign_envelope_id?: string | null
          end_date?: string | null
          estimate_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          recurrence_type?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color_bg: string
          color_text: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color_bg: string
          color_text: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color_bg?: string
          color_text?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_skill_expiry: {
        Row: {
          created_at: string | null
          employee_name: string
          expiry_date: string
          humanity_eid: string | null
          humanity_employee_id: string | null
          id: string
          match_confidence: number | null
          scraped_at: string | null
          skill: string
          updated_at: string | null
          validation_status: string
        }
        Insert: {
          created_at?: string | null
          employee_name: string
          expiry_date: string
          humanity_eid?: string | null
          humanity_employee_id?: string | null
          id?: string
          match_confidence?: number | null
          scraped_at?: string | null
          skill: string
          updated_at?: string | null
          validation_status: string
        }
        Update: {
          created_at?: string | null
          employee_name?: string
          expiry_date?: string
          humanity_eid?: string | null
          humanity_employee_id?: string | null
          id?: string
          match_confidence?: number | null
          scraped_at?: string | null
          skill?: string
          updated_at?: string | null
          validation_status?: string
        }
        Relationships: []
      }
      estimate_additional_fees: {
        Row: {
          comment: string | null
          created_at: string | null
          department_id: string | null
          description: string
          estimate_id: string
          excluded_from_total: boolean
          id: string
          quantity: number
          sort_order: number
          subtotal: number
          unit_cost: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          department_id?: string | null
          description: string
          estimate_id: string
          excluded_from_total?: boolean
          id?: string
          quantity?: number
          sort_order?: number
          subtotal: number
          unit_cost: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string
          estimate_id?: string
          excluded_from_total?: boolean
          id?: string
          quantity?: number
          sort_order?: number
          subtotal?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_additional_fees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_additional_fees_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_attachments: {
        Row: {
          created_at: string | null
          estimate_id: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          estimate_id: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          estimate_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_audit_log: {
        Row: {
          action_type: string
          changed_at: string | null
          changed_by: string | null
          changed_fields: Json | null
          docusign_event_type: string | null
          estimate_id: string
          estimate_number: string
          id: string
          metadata: Json | null
          new_snapshot: Json | null
          old_snapshot: Json | null
          rejection_reason: string | null
        }
        Insert: {
          action_type: string
          changed_at?: string | null
          changed_by?: string | null
          changed_fields?: Json | null
          docusign_event_type?: string | null
          estimate_id: string
          estimate_number: string
          id?: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
          rejection_reason?: string | null
        }
        Update: {
          action_type?: string
          changed_at?: string | null
          changed_by?: string | null
          changed_fields?: Json | null
          docusign_event_type?: string | null
          estimate_id?: string
          estimate_number?: string
          id?: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_audit_log_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          created_at: string | null
          department_id: string | null
          employee_id: string | null
          employee_name: string | null
          employee_wage: number | null
          estimate_id: string
          hours: number
          id: string
          number_of_days: number
          position: string
          qbo_class_id: string | null
          qbo_class_name: string | null
          qbo_item_id: string | null
          qbo_item_name: string | null
          qty: number
          rate: number
          rich_text_comment: string | null
          sort_order: number
          staff_quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          employee_id?: string | null
          employee_name?: string | null
          employee_wage?: number | null
          estimate_id: string
          hours: number
          id?: string
          number_of_days?: number
          position: string
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          qty?: number
          rate: number
          rich_text_comment?: string | null
          sort_order?: number
          staff_quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          employee_id?: string | null
          employee_name?: string | null
          employee_wage?: number | null
          estimate_id?: string
          hours?: number
          id?: string
          number_of_days?: number
          position?: string
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          qty?: number
          rate?: number
          rich_text_comment?: string | null
          sort_order?: number
          staff_quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_signatories: {
        Row: {
          created_at: string | null
          estimate_id: string
          id: string
          signatory_email: string
          signatory_name: string
          signatory_order: number
          signatory_role: string
          signatory_title: string | null
          signed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimate_id: string
          id?: string
          signatory_email: string
          signatory_name: string
          signatory_order?: number
          signatory_role: string
          signatory_title?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimate_id?: string
          id?: string
          signatory_email?: string
          signatory_name?: string
          signatory_order?: number
          signatory_role?: string
          signatory_title?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_signatories_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          estimate_id: string | null
          id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: Json
          estimate_id?: string | null
          id?: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          estimate_id?: string | null
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          associated_invoice: Json | null
          base_estimate_number: string | null
          bill_to_address: string | null
          bill_to_company: string | null
          brand: string | null
          calculation_version: number
          client_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          discount: number | null
          estimate_number: string
          event_date_end: string | null
          event_date_start: string | null
          event_location: string | null
          event_name: string | null
          event_time_end: string | null
          event_time_start: string | null
          expires_at: string | null
          expiry_days: number | null
          hide_totals_on_pdf: boolean
          id: string
          is_archived: boolean | null
          is_recurring: boolean | null
          last_renewal_date: string | null
          last_sent_at: string | null
          lead_source: string | null
          location: string | null
          needs_description: string | null
          next_renewal_date: string | null
          qbo_doc_number: string | null
          qbo_estimate_id: string | null
          recurrence_type: string | null
          recurring_enabled_at: string | null
          recurring_enabled_by: string | null
          renewal_source_estimate_id: string | null
          revision_number: number | null
          rich_text_comments: string | null
          service_duration: unknown
          signatories: Json | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_exempt_enabled: boolean
          tax_rate: number | null
          total: number | null
          updated_at: string | null
          valid_until: string | null
          version: number | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          associated_invoice?: Json | null
          base_estimate_number?: string | null
          bill_to_address?: string | null
          bill_to_company?: string | null
          brand?: string | null
          calculation_version?: number
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          estimate_number: string
          event_date_end?: string | null
          event_date_start?: string | null
          event_location?: string | null
          event_name?: string | null
          event_time_end?: string | null
          event_time_start?: string | null
          expires_at?: string | null
          expiry_days?: number | null
          hide_totals_on_pdf?: boolean
          id?: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
          last_renewal_date?: string | null
          last_sent_at?: string | null
          lead_source?: string | null
          location?: string | null
          needs_description?: string | null
          next_renewal_date?: string | null
          qbo_doc_number?: string | null
          qbo_estimate_id?: string | null
          recurrence_type?: string | null
          recurring_enabled_at?: string | null
          recurring_enabled_by?: string | null
          renewal_source_estimate_id?: string | null
          revision_number?: number | null
          rich_text_comments?: string | null
          service_duration?: unknown
          signatories?: Json | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_exempt_enabled?: boolean
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          associated_invoice?: Json | null
          base_estimate_number?: string | null
          bill_to_address?: string | null
          bill_to_company?: string | null
          brand?: string | null
          calculation_version?: number
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          estimate_number?: string
          event_date_end?: string | null
          event_date_start?: string | null
          event_location?: string | null
          event_name?: string | null
          event_time_end?: string | null
          event_time_start?: string | null
          expires_at?: string | null
          expiry_days?: number | null
          hide_totals_on_pdf?: boolean
          id?: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
          last_renewal_date?: string | null
          last_sent_at?: string | null
          lead_source?: string | null
          location?: string | null
          needs_description?: string | null
          next_renewal_date?: string | null
          qbo_doc_number?: string | null
          qbo_estimate_id?: string | null
          recurrence_type?: string | null
          recurring_enabled_at?: string | null
          recurring_enabled_by?: string | null
          renewal_source_estimate_id?: string | null
          revision_number?: number | null
          rich_text_comments?: string | null
          service_duration?: unknown
          signatories?: Json | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_exempt_enabled?: boolean
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_renewal_source_quote_id_fkey"
            columns: ["renewal_source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_status_log: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          submission_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          submission_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_status_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_status_log_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          additional_answers: Json | null
          candidate_address_line_1: string | null
          candidate_address_line_2: string | null
          candidate_city: string | null
          candidate_country: string | null
          candidate_email: string
          candidate_first_name: string | null
          candidate_last_name: string | null
          candidate_middle_name: string | null
          candidate_phone: string | null
          candidate_postal_code: string | null
          candidate_province: string | null
          created_at: string
          id: string
          job_post_id: string
          resume_file_name: string | null
          resume_file_size: number | null
          resume_mime_type: string | null
          resume_storage_path: string | null
          status: string
          updated_at: string
          uploaded_documents: Json | null
        }
        Insert: {
          additional_answers?: Json | null
          candidate_address_line_1?: string | null
          candidate_address_line_2?: string | null
          candidate_city?: string | null
          candidate_country?: string | null
          candidate_email: string
          candidate_first_name?: string | null
          candidate_last_name?: string | null
          candidate_middle_name?: string | null
          candidate_phone?: string | null
          candidate_postal_code?: string | null
          candidate_province?: string | null
          created_at?: string
          id?: string
          job_post_id: string
          resume_file_name?: string | null
          resume_file_size?: number | null
          resume_mime_type?: string | null
          resume_storage_path?: string | null
          status?: string
          updated_at?: string
          uploaded_documents?: Json | null
        }
        Update: {
          additional_answers?: Json | null
          candidate_address_line_1?: string | null
          candidate_address_line_2?: string | null
          candidate_city?: string | null
          candidate_country?: string | null
          candidate_email?: string
          candidate_first_name?: string | null
          candidate_last_name?: string | null
          candidate_middle_name?: string | null
          candidate_phone?: string | null
          candidate_postal_code?: string | null
          candidate_province?: string | null
          created_at?: string
          id?: string
          job_post_id?: string
          resume_file_name?: string | null
          resume_file_size?: number | null
          resume_mime_type?: string | null
          resume_storage_path?: string | null
          status?: string
          updated_at?: string
          uploaded_documents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_section_permissions: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          permission_level: number
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          permission_level: number
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          permission_level?: number
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_section_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_section_permissions_permission_level_fkey"
            columns: ["permission_level"]
            isOneToOne: false
            referencedRelation: "permission_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_section_permissions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "permission_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_agent: {
        Row: {
          agent_name: string
          created_at: string | null
          email: string | null
          is_active: boolean | null
          is_admin: boolean | null
          last_seen: string | null
          modified: string | null
          name: string
          online_status: string | null
          presence_updated_at: string | null
          public_user_id: string | null
          team: string | null
          user_id: string | null
          zoom_phone_number: string | null
          zoom_status: string | null
          zoom_synced_at: string | null
          zoom_user_id: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          last_seen?: string | null
          modified?: string | null
          name: string
          online_status?: string | null
          presence_updated_at?: string | null
          public_user_id?: string | null
          team?: string | null
          user_id?: string | null
          zoom_phone_number?: string | null
          zoom_status?: string | null
          zoom_synced_at?: string | null
          zoom_user_id?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          last_seen?: string | null
          modified?: string | null
          name?: string
          online_status?: string | null
          presence_updated_at?: string | null
          public_user_id?: string | null
          team?: string | null
          user_id?: string | null
          zoom_phone_number?: string | null
          zoom_status?: string | null
          zoom_synced_at?: string | null
          zoom_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_agent_public_user_id_fkey"
            columns: ["public_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_agent_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "hd_team"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_article: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: number
          is_featured: boolean | null
          is_published: boolean | null
          keywords: string | null
          modified: string | null
          name: string
          search_vector: unknown
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_featured?: boolean | null
          is_published?: boolean | null
          keywords?: string | null
          modified?: string | null
          name: string
          search_vector?: unknown
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_featured?: boolean | null
          is_published?: boolean | null
          keywords?: string | null
          modified?: string | null
          name?: string
          search_vector?: unknown
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_article_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "hd_article_category"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_article_category: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          icon: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      hd_assignment_log: {
        Row: {
          assigned_to_agent: string | null
          assigned_to_team: string | null
          created_at: string
          error_message: string | null
          evaluation_result: Json | null
          id: string
          matched: boolean
          rule_id: number | null
          ticket_id: string
        }
        Insert: {
          assigned_to_agent?: string | null
          assigned_to_team?: string | null
          created_at?: string
          error_message?: string | null
          evaluation_result?: Json | null
          id?: string
          matched: boolean
          rule_id?: number | null
          ticket_id: string
        }
        Update: {
          assigned_to_agent?: string | null
          assigned_to_team?: string | null
          created_at?: string
          error_message?: string | null
          evaluation_result?: Json | null
          id?: string
          matched?: boolean
          rule_id?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_assignment_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "hd_assignment_rule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_assignment_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_assignment_rule: {
        Row: {
          actions: Json | null
          agent_group: string | null
          condition: string | null
          condition_logic: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          last_matched_at: string | null
          match_count: number | null
          name: string
          priority: number | null
          rule_name: string
        }
        Insert: {
          actions?: Json | null
          agent_group?: string | null
          condition?: string | null
          condition_logic?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          last_matched_at?: string | null
          match_count?: number | null
          name: string
          priority?: number | null
          rule_name: string
        }
        Update: {
          actions?: Json | null
          agent_group?: string | null
          condition?: string | null
          condition_logic?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          last_matched_at?: string | null
          match_count?: number | null
          name?: string
          priority?: number | null
          rule_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_assignment_rule_agent_group_fkey"
            columns: ["agent_group"]
            isOneToOne: false
            referencedRelation: "hd_team"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_attachment: {
        Row: {
          activity_id: number | null
          attachment_type: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          source: string | null
          source_url: string | null
          storage_path: string
          ticket_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          activity_id?: number | null
          attachment_type: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          source?: string | null
          source_url?: string | null
          storage_path: string
          ticket_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          activity_id?: number | null
          attachment_type?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          source?: string | null
          source_url?: string | null
          storage_path?: string
          ticket_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_attachment_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_attachment_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_audit_log: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      hd_auto_tag_rule: {
        Row: {
          body_keywords: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          match_mode: string
          name: string
          priority: number
          sender_domain: string | null
          sender_email_pattern: string | null
          subject_keywords: string[] | null
          tag_ids: string[]
          updated_at: string
        }
        Insert: {
          body_keywords?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          match_mode?: string
          name: string
          priority?: number
          sender_domain?: string | null
          sender_email_pattern?: string | null
          subject_keywords?: string[] | null
          tag_ids: string[]
          updated_at?: string
        }
        Update: {
          body_keywords?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          match_mode?: string
          name?: string
          priority?: number
          sender_domain?: string | null
          sender_email_pattern?: string | null
          subject_keywords?: string[] | null
          tag_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      hd_call_event: {
        Row: {
          agent_email: string | null
          call_from: string | null
          call_sid: string
          call_summary: string | null
          call_to: string | null
          created_at: string
          direction: string | null
          event_type: string | null
          id: string
          status: string | null
          storage_id: string | null
          transcript: string | null
          updated_at: string
          zoom_file_url: string | null
        }
        Insert: {
          agent_email?: string | null
          call_from?: string | null
          call_sid: string
          call_summary?: string | null
          call_to?: string | null
          created_at?: string
          direction?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          storage_id?: string | null
          transcript?: string | null
          updated_at?: string
          zoom_file_url?: string | null
        }
        Update: {
          agent_email?: string | null
          call_from?: string | null
          call_sid?: string
          call_summary?: string | null
          call_to?: string | null
          created_at?: string
          direction?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          storage_id?: string | null
          transcript?: string | null
          updated_at?: string
          zoom_file_url?: string | null
        }
        Relationships: []
      }
      hd_customer: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_name: string
          email: string | null
          is_active: boolean | null
          modified: string | null
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          email?: string | null
          is_active?: boolean | null
          modified?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          email?: string | null
          is_active?: boolean | null
          modified?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      hd_dispatch_log: {
        Row: {
          created_at: string | null
          id: number
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      hd_email_delta_state: {
        Row: {
          created_at: string | null
          delta_link: string
          id: number
          integration_id: number
          last_sync_at: string | null
          modified_at: string | null
        }
        Insert: {
          created_at?: string | null
          delta_link: string
          id?: number
          integration_id: number
          last_sync_at?: string | null
          modified_at?: string | null
        }
        Update: {
          created_at?: string | null
          delta_link?: string
          id?: number
          integration_id?: number
          last_sync_at?: string | null
          modified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_email_delta_state_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "hd_integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_email_delta_state_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "hd_integration_health"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_email_setting: {
        Row: {
          api_key: string | null
          created_at: string | null
          email: string
          from_name: string
          id: string
          is_configured: boolean | null
          provider: string
          smtp_password: string | null
          smtp_port: number | null
          smtp_server: string | null
          smtp_username: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          email: string
          from_name?: string
          id?: string
          is_configured?: boolean | null
          provider?: string
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_server?: string | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          email?: string
          from_name?: string
          id?: string
          is_configured?: boolean | null
          provider?: string
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_server?: string | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hd_email_sync: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          direction: string | null
          error_details: Json | null
          id: number
          integration_id: number
          internet_message_id: string | null
          is_spam: boolean | null
          last_retry_at: string | null
          marked_as_spam_at: string | null
          message_id: string
          microsoft_archived: boolean | null
          microsoft_archived_at: string | null
          microsoft_deleted: boolean | null
          microsoft_deleted_at: string | null
          parent_ticket_id: string | null
          processed: boolean | null
          processed_at: string | null
          processing: boolean | null
          processing_error: string | null
          processing_started_at: string | null
          raw_data: Json | null
          received_at: string
          retry_count: number | null
          sender_email: string
          sender_name: string | null
          skip_reason: string | null
          skipped: boolean | null
          source: string | null
          subject: string | null
          thread_hash: string | null
          ticket_created: boolean | null
          ticket_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          error_details?: Json | null
          id?: number
          integration_id: number
          internet_message_id?: string | null
          is_spam?: boolean | null
          last_retry_at?: string | null
          marked_as_spam_at?: string | null
          message_id: string
          microsoft_archived?: boolean | null
          microsoft_archived_at?: string | null
          microsoft_deleted?: boolean | null
          microsoft_deleted_at?: string | null
          parent_ticket_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing?: boolean | null
          processing_error?: string | null
          processing_started_at?: string | null
          raw_data?: Json | null
          received_at: string
          retry_count?: number | null
          sender_email: string
          sender_name?: string | null
          skip_reason?: string | null
          skipped?: boolean | null
          source?: string | null
          subject?: string | null
          thread_hash?: string | null
          ticket_created?: boolean | null
          ticket_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          error_details?: Json | null
          id?: number
          integration_id?: number
          internet_message_id?: string | null
          is_spam?: boolean | null
          last_retry_at?: string | null
          marked_as_spam_at?: string | null
          message_id?: string
          microsoft_archived?: boolean | null
          microsoft_archived_at?: string | null
          microsoft_deleted?: boolean | null
          microsoft_deleted_at?: string | null
          parent_ticket_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing?: boolean | null
          processing_error?: string | null
          processing_started_at?: string | null
          raw_data?: Json | null
          received_at?: string
          retry_count?: number | null
          sender_email?: string
          sender_name?: string | null
          skip_reason?: string | null
          skipped?: boolean | null
          source?: string | null
          subject?: string | null
          thread_hash?: string | null
          ticket_created?: boolean | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_email_sync_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_email_sync_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_email_sync_parent_ticket_id_fkey"
            columns: ["parent_ticket_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_email_sync_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_integration: {
        Row: {
          access_token: string | null
          allowed_senders: string[] | null
          blocked_senders: string[] | null
          client_id: string | null
          client_secret: string | null
          create_tickets_enabled: boolean | null
          created_at: string | null
          created_by: string | null
          error_count: number | null
          id: number
          integration_type: string
          last_error: string | null
          last_sync_at: string | null
          last_token_refresh_at: string | null
          mailbox_email: string
          modified_at: string | null
          name: string
          refresh_token: string | null
          status: string
          sync_enabled: boolean | null
          tenant_id: string | null
          thread_grouping_enabled: boolean | null
          thread_lookback_hours: number | null
          token_expires_at: string | null
          webhook_expires_at: string | null
          webhook_subscription_id: string | null
        }
        Insert: {
          access_token?: string | null
          allowed_senders?: string[] | null
          blocked_senders?: string[] | null
          client_id?: string | null
          client_secret?: string | null
          create_tickets_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          id?: number
          integration_type: string
          last_error?: string | null
          last_sync_at?: string | null
          last_token_refresh_at?: string | null
          mailbox_email: string
          modified_at?: string | null
          name: string
          refresh_token?: string | null
          status?: string
          sync_enabled?: boolean | null
          tenant_id?: string | null
          thread_grouping_enabled?: boolean | null
          thread_lookback_hours?: number | null
          token_expires_at?: string | null
          webhook_expires_at?: string | null
          webhook_subscription_id?: string | null
        }
        Update: {
          access_token?: string | null
          allowed_senders?: string[] | null
          blocked_senders?: string[] | null
          client_id?: string | null
          client_secret?: string | null
          create_tickets_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          id?: number
          integration_type?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_token_refresh_at?: string | null
          mailbox_email?: string
          modified_at?: string | null
          name?: string
          refresh_token?: string | null
          status?: string
          sync_enabled?: boolean | null
          tenant_id?: string | null
          thread_grouping_enabled?: boolean | null
          thread_lookback_hours?: number | null
          token_expires_at?: string | null
          webhook_expires_at?: string | null
          webhook_subscription_id?: string | null
        }
        Relationships: []
      }
      hd_integration_alert_log: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_level: string
          alert_type: string
          id: number
          integration_id: number
          message: string
          notified_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_level: string
          alert_type: string
          id?: number
          integration_id: number
          message: string
          notified_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_level?: string
          alert_type?: string
          id?: number
          integration_id?: number
          message?: string
          notified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_integration_alert_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_integration_alert_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration_health"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_integration_token_refresh_log: {
        Row: {
          action: string
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          integration_id: number | null
          new_expires_at: string | null
          old_expires_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          integration_id?: number | null
          new_expires_at?: string | null
          old_expires_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          integration_id?: number | null
          new_expires_at?: string | null
          old_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_integration_token_refresh_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_integration_token_refresh_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration_health"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_notification: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string
          notification_type: string | null
          ticket: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          notification_type?: string | null
          ticket?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          notification_type?: string | null
          ticket?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_notification_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_saved_reply: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: number
          modified: string | null
          name: string
          reply_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          modified?: string | null
          name: string
          reply_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          modified?: string | null
          name?: string
          reply_name?: string
        }
        Relationships: []
      }
      hd_service_day: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: number
          is_working_day: boolean | null
          parent: string
          start_time: string | null
          workday: string
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: number
          is_working_day?: boolean | null
          parent: string
          start_time?: string | null
          workday: string
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: number
          is_working_day?: boolean | null
          parent?: string
          start_time?: string | null
          workday?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_service_day_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "hd_service_level_agreement"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_service_holiday: {
        Row: {
          created_at: string | null
          description: string | null
          holiday_date: string
          id: number
          sla: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          holiday_date: string
          id?: number
          sla?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          holiday_date?: string
          id?: number
          sla?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_service_holiday_sla_fkey"
            columns: ["sla"]
            isOneToOne: false
            referencedRelation: "hd_service_level_agreement"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_service_level_agreement: {
        Row: {
          created_at: string | null
          description: string | null
          is_default: boolean | null
          modified: string | null
          name: string
          sla_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_default?: boolean | null
          modified?: string | null
          name: string
          sla_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_default?: boolean | null
          modified?: string | null
          name?: string
          sla_name?: string
        }
        Relationships: []
      }
      hd_service_level_priority: {
        Row: {
          created_at: string | null
          id: number
          parent: string
          priority: string | null
          resolution_time: number | null
          response_time: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          parent: string
          priority?: string | null
          resolution_time?: number | null
          response_time?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          parent?: string
          priority?: string | null
          resolution_time?: number | null
          response_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_service_level_priority_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "hd_service_level_agreement"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_service_level_priority_priority_fkey"
            columns: ["priority"]
            isOneToOne: false
            referencedRelation: "hd_ticket_priority"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_tag: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hd_team: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          is_active: boolean | null
          modified: string | null
          name: string
          team_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          modified?: string | null
          name: string
          team_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          is_active?: boolean | null
          modified?: string | null
          name?: string
          team_name?: string
        }
        Relationships: []
      }
      hd_team_member: {
        Row: {
          agent: string
          created_at: string | null
          id: number
          member_name: string | null
          parent: string
        }
        Insert: {
          agent: string
          created_at?: string | null
          id?: number
          member_name?: string | null
          parent: string
        }
        Update: {
          agent?: string
          created_at?: string | null
          id?: number
          member_name?: string | null
          parent?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_team_member_agent_fkey"
            columns: ["agent"]
            isOneToOne: false
            referencedRelation: "hd_agent"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_team_member_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "hd_team"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_ticket: {
        Row: {
          agent_group: string | null
          agreement_status: string | null
          archived: boolean | null
          contact: string | null
          contact_email: string | null
          created_at: string | null
          customer: string | null
          description: string | null
          email_thread_id: string | null
          first_responded_on: string | null
          id: string
          modified: string | null
          owner: string | null
          priority: string | null
          raised_by: string | null
          resolution_by: string | null
          response_by: string | null
          search_vector: unknown
          sequence_id: number | null
          sla: string | null
          source_email_message_id: string | null
          source_integration_id: number | null
          status: string | null
          subject: string
          ticket_type: string | null
        }
        Insert: {
          agent_group?: string | null
          agreement_status?: string | null
          archived?: boolean | null
          contact?: string | null
          contact_email?: string | null
          created_at?: string | null
          customer?: string | null
          description?: string | null
          email_thread_id?: string | null
          first_responded_on?: string | null
          id?: string
          modified?: string | null
          owner?: string | null
          priority?: string | null
          raised_by?: string | null
          resolution_by?: string | null
          response_by?: string | null
          search_vector?: unknown
          sequence_id?: number | null
          sla?: string | null
          source_email_message_id?: string | null
          source_integration_id?: number | null
          status?: string | null
          subject: string
          ticket_type?: string | null
        }
        Update: {
          agent_group?: string | null
          agreement_status?: string | null
          archived?: boolean | null
          contact?: string | null
          contact_email?: string | null
          created_at?: string | null
          customer?: string | null
          description?: string | null
          email_thread_id?: string | null
          first_responded_on?: string | null
          id?: string
          modified?: string | null
          owner?: string | null
          priority?: string | null
          raised_by?: string | null
          resolution_by?: string | null
          response_by?: string | null
          search_vector?: unknown
          sequence_id?: number | null
          sla?: string | null
          source_email_message_id?: string | null
          source_integration_id?: number | null
          status?: string | null
          subject?: string
          ticket_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_agent_group_fkey"
            columns: ["agent_group"]
            isOneToOne: false
            referencedRelation: "hd_team"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_ticket_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "hd_customer"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_ticket_priority_fkey"
            columns: ["priority"]
            isOneToOne: false
            referencedRelation: "hd_ticket_priority"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_ticket_sla_fkey"
            columns: ["sla"]
            isOneToOne: false
            referencedRelation: "hd_service_level_agreement"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_ticket_source_integration_id_fkey"
            columns: ["source_integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_ticket_source_integration_id_fkey"
            columns: ["source_integration_id"]
            isOneToOne: false
            referencedRelation: "hd_integration_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_ticket_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "hd_ticket_status"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "hd_ticket_ticket_type_fkey"
            columns: ["ticket_type"]
            isOneToOne: false
            referencedRelation: "hd_ticket_type"
            referencedColumns: ["name"]
          },
        ]
      }
      hd_ticket_activity: {
        Row: {
          action: string
          activity_type: string | null
          created_at: string | null
          created_by: string | null
          id: number
          is_email: boolean | null
          ticket: string
        }
        Insert: {
          action: string
          activity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_email?: boolean | null
          ticket: string
        }
        Update: {
          action?: string
          activity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_email?: boolean | null
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_activity_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_ticket_comment: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          created_by: string | null
          from_email: string | null
          id: number
          is_internal: boolean | null
          modified: string | null
          ticket: string
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          from_email?: string | null
          id?: number
          is_internal?: boolean | null
          modified?: string | null
          ticket: string
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          from_email?: string | null
          id?: number
          is_internal?: boolean | null
          modified?: string | null
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_comment_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_ticket_cost: {
        Row: {
          amount: number
          category: string | null
          cost_date: string
          created_at: string | null
          description: string
          digital_xa_client_id: string
          digital_xa_client_name: string
          digital_xa_cost_id: string | null
          id: number
          modified: string | null
          notes: string | null
          retry_count: number | null
          submission_error: string | null
          submitted: boolean | null
          submitted_at: string | null
          submitted_by: string | null
          ticket: string
        }
        Insert: {
          amount: number
          category?: string | null
          cost_date: string
          created_at?: string | null
          description: string
          digital_xa_client_id: string
          digital_xa_client_name: string
          digital_xa_cost_id?: string | null
          id?: number
          modified?: string | null
          notes?: string | null
          retry_count?: number | null
          submission_error?: string | null
          submitted?: boolean | null
          submitted_at?: string | null
          submitted_by?: string | null
          ticket: string
        }
        Update: {
          amount?: number
          category?: string | null
          cost_date?: string
          created_at?: string | null
          description?: string
          digital_xa_client_id?: string
          digital_xa_client_name?: string
          digital_xa_cost_id?: string | null
          id?: number
          modified?: string | null
          notes?: string | null
          retry_count?: number | null
          submission_error?: string | null
          submitted?: boolean | null
          submitted_at?: string | null
          submitted_by?: string | null
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_cost_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_ticket_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: number
          rating: number | null
          ticket: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          rating?: number | null
          ticket: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          rating?: number | null
          ticket?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_feedback_ticket_fkey"
            columns: ["ticket"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_ticket_priority: {
        Row: {
          created_at: string | null
          label: string
          name: string
          order_index: number | null
        }
        Insert: {
          created_at?: string | null
          label: string
          name: string
          order_index?: number | null
        }
        Update: {
          created_at?: string | null
          label?: string
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      hd_ticket_status: {
        Row: {
          created_at: string | null
          label: string
          name: string
        }
        Insert: {
          created_at?: string | null
          label: string
          name: string
        }
        Update: {
          created_at?: string | null
          label?: string
          name?: string
        }
        Relationships: []
      }
      hd_ticket_tag: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          tag_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          tag_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          tag_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_ticket_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "hd_tag"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hd_ticket_tag_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "hd_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_ticket_type: {
        Row: {
          created_at: string | null
          label: string
          name: string
        }
        Insert: {
          created_at?: string | null
          label: string
          name: string
        }
        Update: {
          created_at?: string | null
          label?: string
          name?: string
        }
        Relationships: []
      }
      hd_webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          id: number
          payload: Json
          service: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: number
          payload: Json
          service: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          payload?: Json
          service?: string
        }
        Relationships: []
      }
      humanity_site_mappings: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          qbo_customer_id: string | null
          qbo_customer_name: string | null
          remote_site: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          qbo_customer_id?: string | null
          qbo_customer_name?: string | null
          remote_site: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          qbo_customer_id?: string | null
          qbo_customer_name?: string | null
          remote_site?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "humanity_site_mappings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          http_status: number | null
          id: string
          integration_id: string | null
          intuit_tid: string | null
          method: string
          request_payload: Json | null
          response_payload: Json | null
          service: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          integration_id?: string | null
          intuit_tid?: string | null
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          service: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          integration_id?: string | null
          intuit_tid?: string | null
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          service?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          adp_client_id: string | null
          connected_at: string | null
          created_at: string | null
          created_by: string | null
          credentials: Json | null
          default_tax_code: string | null
          default_tax_code_id: string | null
          default_tax_exempt_code: string | null
          default_tax_exempt_code_id: string | null
          error_message: string | null
          id: string
          incremental_sync_enabled: boolean | null
          integration_type: string | null
          is_active: boolean | null
          last_auth_error: string | null
          last_full_sync_at: string | null
          last_incremental_sync_at: string | null
          last_successful_doc_number: string | null
          last_sync_at: string | null
          last_synced_at: string | null
          needs_reauth: boolean | null
          qbo_custom_field_billing_period_id: string | null
          qbo_custom_field_location_id: string | null
          qbo_custom_field_po_job_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          service: string
          settings: Json | null
          sync_status: string | null
          tax_code_updated_at: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          adp_client_id?: string | null
          connected_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          default_tax_code?: string | null
          default_tax_code_id?: string | null
          default_tax_exempt_code?: string | null
          default_tax_exempt_code_id?: string | null
          error_message?: string | null
          id?: string
          incremental_sync_enabled?: boolean | null
          integration_type?: string | null
          is_active?: boolean | null
          last_auth_error?: string | null
          last_full_sync_at?: string | null
          last_incremental_sync_at?: string | null
          last_successful_doc_number?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          needs_reauth?: boolean | null
          qbo_custom_field_billing_period_id?: string | null
          qbo_custom_field_location_id?: string | null
          qbo_custom_field_po_job_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          service: string
          settings?: Json | null
          sync_status?: string | null
          tax_code_updated_at?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          adp_client_id?: string | null
          connected_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credentials?: Json | null
          default_tax_code?: string | null
          default_tax_code_id?: string | null
          default_tax_exempt_code?: string | null
          default_tax_exempt_code_id?: string | null
          error_message?: string | null
          id?: string
          incremental_sync_enabled?: boolean | null
          integration_type?: string | null
          is_active?: boolean | null
          last_auth_error?: string | null
          last_full_sync_at?: string | null
          last_incremental_sync_at?: string | null
          last_successful_doc_number?: string | null
          last_sync_at?: string | null
          last_synced_at?: string | null
          needs_reauth?: boolean | null
          qbo_custom_field_billing_period_id?: string | null
          qbo_custom_field_location_id?: string | null
          qbo_custom_field_po_job_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          service?: string
          settings?: Json | null
          sync_status?: string | null
          tax_code_updated_at?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_audit_log: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string
          changed_fields: Json | null
          id: string
          invoice_id: string
          invoice_number: string
          metadata: Json | null
          new_snapshot: Json | null
          old_snapshot: Json | null
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by: string
          changed_fields?: Json | null
          id?: string
          invoice_id: string
          invoice_number: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string
          changed_fields?: Json | null
          id?: string
          invoice_id?: string
          invoice_number?: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_audit_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_discounts: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          sort_order: number
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          sort_order?: number
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          sort_order?: number
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_discounts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          group_id: string | null
          group_type: string | null
          id: string
          invoice_id: string | null
          line_type: string | null
          qbo_class_id: string | null
          qbo_class_name: string | null
          qbo_item_id: string | null
          qbo_item_name: string | null
          quantity: number | null
          rate: number
          show_in_summary: boolean | null
          sort_order: number | null
          timeclock_ids: string[] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          group_id?: string | null
          group_type?: string | null
          id?: string
          invoice_id?: string | null
          line_type?: string | null
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          quantity?: number | null
          rate: number
          show_in_summary?: boolean | null
          sort_order?: number | null
          timeclock_ids?: string[] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          group_id?: string | null
          group_type?: string | null
          id?: string
          invoice_id?: string | null
          line_type?: string | null
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string | null
          qbo_item_name?: string | null
          quantity?: number | null
          rate?: number
          show_in_summary?: boolean | null
          sort_order?: number | null
          timeclock_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          brand: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          gst_enabled: boolean | null
          id: string
          invoice_number: string
          issue_date: string | null
          last_validated_at: string | null
          metadata: Json | null
          mode: string
          notes: string | null
          office_id: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          qbo_doc_number: string | null
          qbo_invoice_id: string | null
          overtime_override: boolean | null
          send_invoice_to_customer: boolean
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total: number | null
          updated_at: string | null
          validation_issues: Json | null
          validation_status: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          brand?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          gst_enabled?: boolean | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          last_validated_at?: string | null
          metadata?: Json | null
          mode?: string
          notes?: string | null
          office_id?: string | null
          overtime_override?: boolean | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          qbo_doc_number?: string | null
          qbo_invoice_id?: string | null
          send_invoice_to_customer?: boolean
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
          validation_issues?: Json | null
          validation_status?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          brand?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          gst_enabled?: boolean | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          last_validated_at?: string | null
          metadata?: Json | null
          mode?: string
          notes?: string | null
          office_id?: string | null
          overtime_override?: boolean | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          qbo_doc_number?: string | null
          qbo_invoice_id?: string | null
          send_invoice_to_customer?: boolean
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
          validation_issues?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_document_uploads: {
        Row: {
          created_at: string | null
          extracted_description: string | null
          extracted_metadata: Json | null
          extracted_title: string | null
          file_name: string
          file_size: number
          id: string
          job_post_id: string | null
          job_template_id: string | null
          mime_type: string | null
          storage_path: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          extracted_description?: string | null
          extracted_metadata?: Json | null
          extracted_title?: string | null
          file_name: string
          file_size: number
          id?: string
          job_post_id?: string | null
          job_template_id?: string | null
          mime_type?: string | null
          storage_path: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          extracted_description?: string | null
          extracted_metadata?: Json | null
          extracted_title?: string | null
          file_name?: string
          file_size?: number
          id?: string
          job_post_id?: string | null
          job_template_id?: string | null
          mime_type?: string | null
          storage_path?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_document_uploads_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_document_uploads_job_template_id_fkey"
            columns: ["job_template_id"]
            isOneToOne: false
            referencedRelation: "job_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_document_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_required_forms: {
        Row: {
          attached_at: string
          attached_by: string
          form_type_id: string
          is_required: boolean
          job_post_id: string
        }
        Insert: {
          attached_at?: string
          attached_by: string
          form_type_id: string
          is_required?: boolean
          job_post_id: string
        }
        Update: {
          attached_at?: string
          attached_by?: string
          form_type_id?: string
          is_required?: boolean
          job_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_required_forms_attached_by_fkey"
            columns: ["attached_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_required_forms_form_type_id_fkey"
            columns: ["form_type_id"]
            isOneToOne: false
            referencedRelation: "required_form_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_required_forms_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          additional_questions: Json | null
          application_form_link: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          linkedin_company_enabled: boolean | null
          linkedin_member_enabled: boolean | null
          promote_on_linkedin: boolean | null
          public_link: string | null
          publish_to_website: boolean | null
          selected_linkedin_profile_ids: Json | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          webflow_collection_id: string | null
          webflow_item_id: string | null
          webflow_last_attempt_at: string | null
          webflow_last_error: string | null
          webflow_publish_status: string | null
          webflow_published_at: string | null
          webflow_successfully_published_at: string | null
        }
        Insert: {
          additional_questions?: Json | null
          application_form_link?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          linkedin_company_enabled?: boolean | null
          linkedin_member_enabled?: boolean | null
          promote_on_linkedin?: boolean | null
          public_link?: string | null
          publish_to_website?: boolean | null
          selected_linkedin_profile_ids?: Json | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          webflow_collection_id?: string | null
          webflow_item_id?: string | null
          webflow_last_attempt_at?: string | null
          webflow_last_error?: string | null
          webflow_publish_status?: string | null
          webflow_published_at?: string | null
          webflow_successfully_published_at?: string | null
        }
        Update: {
          additional_questions?: Json | null
          application_form_link?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          linkedin_company_enabled?: boolean | null
          linkedin_member_enabled?: boolean | null
          promote_on_linkedin?: boolean | null
          public_link?: string | null
          publish_to_website?: boolean | null
          selected_linkedin_profile_ids?: Json | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          webflow_collection_id?: string | null
          webflow_item_id?: string | null
          webflow_last_attempt_at?: string | null
          webflow_last_error?: string | null
          webflow_publish_status?: string | null
          webflow_published_at?: string | null
          webflow_successfully_published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "job_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_templates: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          id: string
          is_active: boolean | null
          name: string
          title_template: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          title_template: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          title_template?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Keys: {
        Row: {
          auth_refresh_url: string | null
          auth_url: string | null
          client_id: string | null
          client_secret: string | null
          company_id: string | null
          created_at: string
          id: number
          refresh_token: string | null
          service: string | null
          token: string | null
        }
        Insert: {
          auth_refresh_url?: string | null
          auth_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          company_id?: string | null
          created_at?: string
          id?: number
          refresh_token?: string | null
          service?: string | null
          token?: string | null
        }
        Update: {
          auth_refresh_url?: string | null
          auth_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          company_id?: string | null
          created_at?: string
          id?: number
          refresh_token?: string | null
          service?: string | null
          token?: string | null
        }
        Relationships: []
      }
      lead_department_targets: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          target_amount: number
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          target_amount?: number
          updated_at?: string | null
          year?: number
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          target_amount?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_department_targets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content: string
          created_at: string | null
          created_by: string
          due_date: string | null
          id: string
          lead_id: string
          note_type: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content: string
          created_at?: string | null
          created_by: string
          due_date?: string | null
          id?: string
          lead_id: string
          note_type: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          due_date?: string | null
          id?: string
          lead_id?: string
          note_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string
          contact_id: string
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          estimate_id: string | null
          estimated_closing: string | null
          estimated_value: number | null
          id: string
          is_deleted: boolean | null
          project_description: string
          status: string
          target_revenue: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          contact_id: string
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          estimate_id?: string | null
          estimated_closing?: string | null
          estimated_value?: number | null
          id?: string
          is_deleted?: boolean | null
          project_description: string
          status?: string
          target_revenue: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          contact_id?: string
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          estimate_id?: string | null
          estimated_closing?: string | null
          estimated_value?: number | null
          id?: string
          is_deleted?: boolean | null
          project_description?: string
          status?: string
          target_revenue?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_distribution_list: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          integration_id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          integration_id: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          integration_id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_distribution_list_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "linkedin_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_integration_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          http_status: number | null
          id: string
          job_post_id: string | null
          linkedin_integration_id: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          job_post_id?: string | null
          linkedin_integration_id?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          job_post_id?: string | null
          linkedin_integration_id?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_integration_logs_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_integration_logs_linkedin_integration_id_fkey"
            columns: ["linkedin_integration_id"]
            isOneToOne: false
            referencedRelation: "linkedin_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_integrations: {
        Row: {
          access_token: string
          auto_publish: boolean | null
          client_id: string
          company_logo_url: string | null
          company_name: string | null
          connected_at: string | null
          created_at: string | null
          created_by: string
          error_message: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_auth_error: string | null
          last_sync_at: string | null
          linkedin_avatar_url: string | null
          linkedin_id: string
          linkedin_name: string
          member_email: string | null
          needs_reauth: boolean | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          auto_publish?: boolean | null
          client_id: string
          company_logo_url?: string | null
          company_name?: string | null
          connected_at?: string | null
          created_at?: string | null
          created_by: string
          error_message?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_auth_error?: string | null
          last_sync_at?: string | null
          linkedin_avatar_url?: string | null
          linkedin_id: string
          linkedin_name: string
          member_email?: string | null
          needs_reauth?: boolean | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          auto_publish?: boolean | null
          client_id?: string
          company_logo_url?: string | null
          company_name?: string | null
          connected_at?: string | null
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_auth_error?: string | null
          last_sync_at?: string | null
          linkedin_avatar_url?: string | null
          linkedin_id?: string
          linkedin_name?: string
          member_email?: string | null
          needs_reauth?: boolean | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      linkedin_job_posts: {
        Row: {
          attempt_count: number | null
          clicks: number | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          error_message: string | null
          id: string
          impressions: number | null
          job_post_id: string
          last_attempt_at: string | null
          last_error_message: string | null
          last_stats_sync: string | null
          linkedin_ad_context: Json | null
          linkedin_author_urn: string | null
          linkedin_content_type: string | null
          linkedin_content_urn: string | null
          linkedin_created_at: string | null
          linkedin_distribution_config: Json | null
          linkedin_full_response: Json | null
          linkedin_integration_id: string
          linkedin_lifecycle_state: string | null
          linkedin_lifecycle_state_info: Json | null
          linkedin_modified_at: string | null
          linkedin_post_url: string | null
          linkedin_urn: string
          linkedin_visibility: string | null
          post_description: string | null
          post_link: string | null
          post_title: string
          published_at: string | null
          retry_count: number | null
          status: string | null
          successfully_published_at: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          clicks?: number | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          impressions?: number | null
          job_post_id: string
          last_attempt_at?: string | null
          last_error_message?: string | null
          last_stats_sync?: string | null
          linkedin_ad_context?: Json | null
          linkedin_author_urn?: string | null
          linkedin_content_type?: string | null
          linkedin_content_urn?: string | null
          linkedin_created_at?: string | null
          linkedin_distribution_config?: Json | null
          linkedin_full_response?: Json | null
          linkedin_integration_id: string
          linkedin_lifecycle_state?: string | null
          linkedin_lifecycle_state_info?: Json | null
          linkedin_modified_at?: string | null
          linkedin_post_url?: string | null
          linkedin_urn: string
          linkedin_visibility?: string | null
          post_description?: string | null
          post_link?: string | null
          post_title: string
          published_at?: string | null
          retry_count?: number | null
          status?: string | null
          successfully_published_at?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          clicks?: number | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          impressions?: number | null
          job_post_id?: string
          last_attempt_at?: string | null
          last_error_message?: string | null
          last_stats_sync?: string | null
          linkedin_ad_context?: Json | null
          linkedin_author_urn?: string | null
          linkedin_content_type?: string | null
          linkedin_content_urn?: string | null
          linkedin_created_at?: string | null
          linkedin_distribution_config?: Json | null
          linkedin_full_response?: Json | null
          linkedin_integration_id?: string
          linkedin_lifecycle_state?: string | null
          linkedin_lifecycle_state_info?: Json | null
          linkedin_modified_at?: string | null
          linkedin_post_url?: string | null
          linkedin_urn?: string
          linkedin_visibility?: string | null
          post_description?: string | null
          post_link?: string | null
          post_title?: string
          published_at?: string | null
          retry_count?: number | null
          status?: string | null
          successfully_published_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_job_posts_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_job_posts_linkedin_integration_id_fkey"
            columns: ["linkedin_integration_id"]
            isOneToOne: false
            referencedRelation: "linkedin_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_post_stats: {
        Row: {
          clicks: number | null
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          linkedin_job_post_id: string
          recorded_at: string | null
          shares: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          linkedin_job_post_id: string
          recorded_at?: string | null
          shares?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          linkedin_job_post_id?: string
          recorded_at?: string | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_post_stats_linkedin_job_post_id_fkey"
            columns: ["linkedin_job_post_id"]
            isOneToOne: false
            referencedRelation: "linkedin_job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          delivered_at: string | null
          email_address: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          phone_number: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_address?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_address?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_state_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_state_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_code: string
          province: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_code: string
          province: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_code?: string
          province?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      on_demand_requests: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          location_address: string
          location_lat: number
          location_lng: number
          notes: string | null
          phone: string
          photo_urls: string[] | null
          service_date: string | null
          service_time: string | null
          service_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          location_address: string
          location_lat: number
          location_lng: number
          notes?: string | null
          phone: string
          photo_urls?: string[] | null
          service_date?: string | null
          service_time?: string | null
          service_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          location_address?: string
          location_lat?: number
          location_lng?: number
          notes?: string | null
          phone?: string
          photo_urls?: string[] | null
          service_date?: string | null
          service_time?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      operations_form_answers: {
        Row: {
          array_answer: Json | null
          boolean_answer: boolean | null
          composite_answer: Json | null
          created_at: string | null
          file_storage_path: string | null
          id: string
          numeric_answer: number | null
          question_id: string
          submission_id: string
          text_answer: string | null
        }
        Insert: {
          array_answer?: Json | null
          boolean_answer?: boolean | null
          composite_answer?: Json | null
          created_at?: string | null
          file_storage_path?: string | null
          id?: string
          numeric_answer?: number | null
          question_id: string
          submission_id: string
          text_answer?: string | null
        }
        Update: {
          array_answer?: Json | null
          boolean_answer?: boolean | null
          composite_answer?: Json | null
          created_at?: string | null
          file_storage_path?: string | null
          id?: string
          numeric_answer?: number | null
          question_id?: string
          submission_id?: string
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_form_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "operations_form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_form_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "operations_form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_form_questions: {
        Row: {
          composite_config: Json | null
          created_at: string | null
          description: string | null
          display_order: number
          form_template_id: string
          id: string
          is_required: boolean | null
          options: Json | null
          question_text: string
          question_type: string
          updated_at: string | null
        }
        Insert: {
          composite_config?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          form_template_id: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text: string
          question_type: string
          updated_at?: string | null
        }
        Update: {
          composite_config?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          form_template_id?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text?: string
          question_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_form_questions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "operations_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_form_submissions: {
        Row: {
          client_id: string | null
          created_at: string | null
          device_type: string | null
          form_template_id: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          ip_address: unknown
          pdf_generated_at: string | null
          pdf_url: string | null
          shift_id: string | null
          submission_date: string
          submission_time: string
          submitted_at: string | null
          submitted_by: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          device_type?: string | null
          form_template_id: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          ip_address?: unknown
          pdf_generated_at?: string | null
          pdf_url?: string | null
          shift_id?: string | null
          submission_date?: string
          submission_time?: string
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          device_type?: string | null
          form_template_id?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          ip_address?: unknown
          pdf_generated_at?: string | null
          pdf_url?: string | null
          shift_id?: string | null
          submission_date?: string
          submission_time?: string
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_submitted_by"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_form_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_form_submissions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "operations_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_form_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          footer_text: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_client: boolean | null
          requires_shift: boolean | null
          updated_at: string | null
          updated_by: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_client?: boolean | null
          requires_shift?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_client?: boolean | null
          requires_shift?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      permission_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permission_levels: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      permission_sections: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          billable_rate: number
          created_at: string | null
          id: string
          is_active: boolean
          position: string
          rate_per_hour: number
          updated_at: string | null
        }
        Insert: {
          billable_rate: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          position: string
          rate_per_hour: number
          updated_at?: string | null
        }
        Update: {
          billable_rate?: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          position?: string
          rate_per_hour?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      Positions: {
        Row: {
          created_at: string
          id: number
          position_ID: string | null
          position_NAME: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          position_ID?: string | null
          position_NAME?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          position_ID?: string | null
          position_NAME?: string | null
        }
        Relationships: []
      }
      printnode_settings: {
        Row: {
          api_key: string | null
          created_at: string | null
          id: string
          label_height_inches: number | null
          label_width_inches: number | null
          selected_printer_id: string | null
          selected_printer_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          label_height_inches?: number | null
          label_width_inches?: number | null
          selected_printer_id?: string | null
          selected_printer_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          label_height_inches?: number | null
          label_width_inches?: number | null
          selected_printer_id?: string | null
          selected_printer_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "printnode_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_item_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          integration_id: string
          internal_position_id: string | null
          is_active: boolean | null
          is_default: boolean | null
          mapping_type: string
          qbo_class_id: string | null
          qbo_class_name: string | null
          qbo_item_id: string
          qbo_item_name: string
          qbo_item_type: string | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          integration_id: string
          internal_position_id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          mapping_type: string
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id: string
          qbo_item_name: string
          qbo_item_type?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          integration_id?: string
          internal_position_id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          mapping_type?: string
          qbo_class_id?: string | null
          qbo_class_name?: string | null
          qbo_item_id?: string
          qbo_item_name?: string
          qbo_item_type?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qbo_item_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_item_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_item_mappings_internal_position_id_fkey"
            columns: ["internal_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_webhook_logs: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: number
          last_updated: string | null
          operation: string
          payload: Json | null
          processed_at: string | null
          realm_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: number
          last_updated?: string | null
          operation: string
          payload?: Json | null
          processed_at?: string | null
          realm_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: number
          last_updated?: string | null
          operation?: string
          payload?: Json | null
          processed_at?: string | null
          realm_id?: string
          status?: string | null
        }
        Relationships: []
      }
      receipt_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string
          created_at: string | null
          id: string
          notes: string | null
          receipt_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          created_at?: string | null
          id?: string
          notes?: string | null
          receipt_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_approvals_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          notes: string | null
          receipt_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          notes?: string | null
          receipt_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_audit_log_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_images: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          receipt_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          receipt_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          receipt_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_images_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payload: Json | null
          posted_date: string | null
          rejection_reason: string | null
          status: string
          submitter_email: string
          submitter_user_id: string | null
          subtotal: number
          tax: number | null
          tax_rate: number | null
          total_amt: number
          transaction_date: string
          updated_at: string | null
          vendor_address: string | null
          vendor_name: string
          vendor_qbo_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          posted_date?: string | null
          rejection_reason?: string | null
          status?: string
          submitter_email: string
          submitter_user_id?: string | null
          subtotal?: number
          tax?: number | null
          tax_rate?: number | null
          total_amt?: number
          transaction_date: string
          updated_at?: string | null
          vendor_address?: string | null
          vendor_name: string
          vendor_qbo_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payload?: Json | null
          posted_date?: string | null
          rejection_reason?: string | null
          status?: string
          submitter_email?: string
          submitter_user_id?: string | null
          subtotal?: number
          tax?: number | null
          tax_rate?: number | null
          total_amt?: number
          transaction_date?: string
          updated_at?: string | null
          vendor_address?: string | null
          vendor_name?: string
          vendor_qbo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_submitter_user_id_fkey"
            columns: ["submitter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_notification_recipients: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_notification_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      required_form_types: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "required_form_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "required_form_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_gap_manual_billings: {
        Row: {
          billed_at: string
          billed_by_user_id: string | null
          client_name: string | null
          clock_id: string
          id: string
          invoice_number: string | null
          notes: string | null
          qbo_invoice_id: string | null
        }
        Insert: {
          billed_at?: string
          billed_by_user_id?: string | null
          client_name?: string | null
          clock_id: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          qbo_invoice_id?: string | null
        }
        Update: {
          billed_at?: string
          billed_by_user_id?: string | null
          client_name?: string | null
          clock_id?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          qbo_invoice_id?: string | null
        }
        Relationships: []
      }
      section_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_level: number
          section_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_level: number
          section_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_level?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_permissions_permission_level_fkey"
            columns: ["permission_level"]
            isOneToOne: false
            referencedRelation: "permission_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_permissions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "permission_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      Shifts: {
        Row: {
          break_minutes: number | null
          client_id: string | null
          created_at: string
          employee_eids: string | null
          employee_ids: string | null
          end_date: string | null
          end_time: string | null
          external_id: string | null
          id: number
          location: string | null
          name: string | null
          notes: string | null
          overtime_hours: number | null
          skill_id: string | null
          skills: string | null
          staff: string | null
          staff_accepted: string | null
          staff_needed: string | null
          start_date: string | null
          start_time: string | null
          total_hours: number | null
        }
        Insert: {
          break_minutes?: number | null
          client_id?: string | null
          created_at?: string
          employee_eids?: string | null
          employee_ids?: string | null
          end_date?: string | null
          end_time?: string | null
          external_id?: string | null
          id?: number
          location?: string | null
          name?: string | null
          notes?: string | null
          overtime_hours?: number | null
          skill_id?: string | null
          skills?: string | null
          staff?: string | null
          staff_accepted?: string | null
          staff_needed?: string | null
          start_date?: string | null
          start_time?: string | null
          total_hours?: number | null
        }
        Update: {
          break_minutes?: number | null
          client_id?: string | null
          created_at?: string
          employee_eids?: string | null
          employee_ids?: string | null
          end_date?: string | null
          end_time?: string | null
          external_id?: string | null
          id?: number
          location?: string | null
          name?: string | null
          notes?: string | null
          overtime_hours?: number | null
          skill_id?: string | null
          skills?: string | null
          staff?: string | null
          staff_accepted?: string | null
          staff_needed?: string | null
          start_date?: string | null
          start_time?: string | null
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Shifts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_holidays: {
        Row: {
          created_at: string | null
          external_holiday_id: number | null
          holiday_date: string
          holiday_name_en: string
          holiday_name_fr: string | null
          id: string
          is_active: boolean | null
          is_federal: boolean | null
          last_sync_at: string | null
          observed_date: string
          province_code: string
          province_name_en: string | null
          province_name_fr: string | null
          source_link: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_holiday_id?: number | null
          holiday_date: string
          holiday_name_en: string
          holiday_name_fr?: string | null
          id?: string
          is_active?: boolean | null
          is_federal?: boolean | null
          last_sync_at?: string | null
          observed_date: string
          province_code: string
          province_name_en?: string | null
          province_name_fr?: string | null
          source_link?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_holiday_id?: number | null
          holiday_date?: string
          holiday_name_en?: string
          holiday_name_fr?: string | null
          id?: string
          is_active?: boolean | null
          is_federal?: boolean | null
          last_sync_at?: string | null
          observed_date?: string
          province_code?: string
          province_name_en?: string | null
          province_name_fr?: string | null
          source_link?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stat_holidays_sync_config: {
        Row: {
          created_at: string | null
          id: number
          last_sync_at: string | null
          last_synced_year: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_sync_at?: string | null
          last_synced_year?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          last_sync_at?: string | null
          last_synced_year?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tender_additional_fees: {
        Row: {
          created_at: string
          department_id: string | null
          description: string
          id: string
          quantity: number
          sort_order: number
          subtotal: number
          tender_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          quantity: number
          sort_order?: number
          subtotal: number
          tender_id: string
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          quantity?: number
          sort_order?: number
          subtotal?: number
          tender_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_additional_fees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_additional_fees_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          storage_path: string
          tender_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          storage_path: string
          tender_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_path?: string
          tender_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_attachments_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_audit_log: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string | null
          changed_fields: Json | null
          id: string
          metadata: Json | null
          new_snapshot: Json | null
          old_snapshot: Json | null
          rejection_reason: string | null
          tender_id: string
          tender_number: string
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by?: string | null
          changed_fields?: Json | null
          id?: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
          rejection_reason?: string | null
          tender_id: string
          tender_number: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string | null
          changed_fields?: Json | null
          id?: string
          metadata?: Json | null
          new_snapshot?: Json | null
          old_snapshot?: Json | null
          rejection_reason?: string | null
          tender_id?: string
          tender_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_audit_log_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_line_items: {
        Row: {
          created_at: string
          department_id: string | null
          hours: string
          id: string
          position: string
          rate: number
          sort_order: number
          subtotal: number
          tender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          hours: string
          id?: string
          position: string
          rate: number
          sort_order?: number
          subtotal: number
          tender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          hours?: string
          id?: string
          position?: string
          rate?: number
          sort_order?: number
          subtotal?: number
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_line_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_line_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          tender_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          tender_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          tender_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tender_versions_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          base_tender_number: string | null
          bill_to_address: string | null
          bill_to_company: string | null
          brand: string | null
          calculation_version: number
          client_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          event_date_end: string | null
          event_date_start: string | null
          event_location: string | null
          event_name: string | null
          event_time_end: string | null
          event_time_start: string | null
          expires_at: string | null
          expiry_days: number | null
          hide_totals_on_pdf: boolean | null
          id: string
          is_archived: boolean | null
          last_sent_at: string | null
          location: string | null
          needs_description: string | null
          revision_number: number
          rich_text_comments: string | null
          service_duration: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_exempt_enabled: boolean | null
          tax_rate: number
          tender_number: string
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          base_tender_number?: string | null
          bill_to_address?: string | null
          bill_to_company?: string | null
          brand?: string | null
          calculation_version?: number
          client_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          event_date_end?: string | null
          event_date_start?: string | null
          event_location?: string | null
          event_name?: string | null
          event_time_end?: string | null
          event_time_start?: string | null
          expires_at?: string | null
          expiry_days?: number | null
          hide_totals_on_pdf?: boolean | null
          id?: string
          is_archived?: boolean | null
          last_sent_at?: string | null
          location?: string | null
          needs_description?: string | null
          revision_number?: number
          rich_text_comments?: string | null
          service_duration?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_exempt_enabled?: boolean | null
          tax_rate?: number
          tender_number: string
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          base_tender_number?: string | null
          bill_to_address?: string | null
          bill_to_company?: string | null
          brand?: string | null
          calculation_version?: number
          client_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          event_date_end?: string | null
          event_date_start?: string | null
          event_location?: string | null
          event_name?: string | null
          event_time_end?: string | null
          event_time_start?: string | null
          expires_at?: string | null
          expiry_days?: number | null
          hide_totals_on_pdf?: boolean | null
          id?: string
          is_archived?: boolean | null
          last_sent_at?: string | null
          location?: string | null
          needs_description?: string | null
          revision_number?: number
          rich_text_comments?: string | null
          service_duration?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_exempt_enabled?: boolean | null
          tax_rate?: number
          tender_number?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      Threads: {
        Row: {
          action_method: string | null
          action_status: string | null
          company_id: string | null
          created_at: string
          direction: string | null
          email: string | null
          external_converation_id: string | null
          external_message_id: string | null
          id: number
          message: string | null
          phone: string | null
          shift_id: string | null
          thread_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_method?: string | null
          action_status?: string | null
          company_id?: string | null
          created_at?: string
          direction?: string | null
          email?: string | null
          external_converation_id?: string | null
          external_message_id?: string | null
          id?: number
          message?: string | null
          phone?: string | null
          shift_id?: string | null
          thread_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_method?: string | null
          action_status?: string | null
          company_id?: string | null
          created_at?: string
          direction?: string | null
          email?: string | null
          external_converation_id?: string | null
          external_message_id?: string | null
          id?: number
          message?: string | null
          phone?: string | null
          shift_id?: string | null
          thread_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timeclock_settings: {
        Row: {
          allow_multiple_weekly_ot: boolean | null
          apply_ot_by_position: boolean | null
          created_at: string | null
          decimal_precision: number | null
          id: string
          max_daily_hours: number | null
          max_monthly_hours: number | null
          max_weekly_hours: number | null
          ot_break_trigger: number | null
          ot_calculation_basis: string | null
          ot_hours_trigger: number | null
          ot_rate_multiplier: number | null
          ot_rolling_window_hours: number | null
          stat_rate_multiplier: number | null
          stat_trigger_by: string | null
          stat_use_gov_api: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allow_multiple_weekly_ot?: boolean | null
          apply_ot_by_position?: boolean | null
          created_at?: string | null
          decimal_precision?: number | null
          id?: string
          max_daily_hours?: number | null
          max_monthly_hours?: number | null
          max_weekly_hours?: number | null
          ot_break_trigger?: number | null
          ot_calculation_basis?: string | null
          ot_hours_trigger?: number | null
          ot_rate_multiplier?: number | null
          ot_rolling_window_hours?: number | null
          stat_rate_multiplier?: number | null
          stat_trigger_by?: string | null
          stat_use_gov_api?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allow_multiple_weekly_ot?: boolean | null
          apply_ot_by_position?: boolean | null
          created_at?: string | null
          decimal_precision?: number | null
          id?: string
          max_daily_hours?: number | null
          max_monthly_hours?: number | null
          max_weekly_hours?: number | null
          ot_break_trigger?: number | null
          ot_calculation_basis?: string | null
          ot_hours_trigger?: number | null
          ot_rate_multiplier?: number | null
          ot_rolling_window_hours?: number | null
          stat_rate_multiplier?: number | null
          stat_trigger_by?: string | null
          stat_use_gov_api?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_group_memberships: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_section_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_level: number
          section_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_level: number
          section_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_level?: number
          section_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_section_permissions_permission_level_fkey"
            columns: ["permission_level"]
            isOneToOne: false
            referencedRelation: "permission_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_section_permissions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "permission_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_section_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          adp_employee_id: string | null
          adp_last_modified: string | null
          adp_last_validated: string | null
          adp_validation_warnings: string[] | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          microsoft_id: string | null
          nickname: string | null
          oauth_metadata: Json | null
          oauth_provider: string | null
          phone: string | null
          profile_completed: boolean | null
          release_seen: boolean | null
          role: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          adp_employee_id?: string | null
          adp_last_modified?: string | null
          adp_last_validated?: string | null
          adp_validation_warnings?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          microsoft_id?: string | null
          nickname?: string | null
          oauth_metadata?: Json | null
          oauth_provider?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          release_seen?: boolean | null
          role?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          adp_employee_id?: string | null
          adp_last_modified?: string | null
          adp_last_validated?: string | null
          adp_validation_warnings?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          microsoft_id?: string | null
          nickname?: string | null
          oauth_metadata?: Json | null
          oauth_provider?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          release_seen?: boolean | null
          role?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      releases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      release_slides: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          release_id: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          release_id: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          release_id?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_slides_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      Users: {
        Row: {
          active: boolean | null
          adp_employee_id: string | null
          company: string | null
          created_at: string
          email: string | null
          external_id: string | null
          first_name: string | null
          id: number
          last_name: string | null
          location: string | null
          phone: string | null
          role: string | null
          skills: string | null
          status_in_adp: string | null
          status_in_humanity: string | null
          synced_from_adp_at: string | null
        }
        Insert: {
          active?: boolean | null
          adp_employee_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          location?: string | null
          phone?: string | null
          role?: string | null
          skills?: string | null
          status_in_adp?: string | null
          status_in_humanity?: string | null
          synced_from_adp_at?: string | null
        }
        Update: {
          active?: boolean | null
          adp_employee_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          location?: string | null
          phone?: string | null
          role?: string | null
          skills?: string | null
          status_in_adp?: string | null
          status_in_humanity?: string | null
          synced_from_adp_at?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          acct_num: string | null
          balance: number | null
          bill_addr: Json | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          display_name: string
          family_name: string | null
          given_name: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          primary_email: string | null
          primary_phone: string | null
          print_on_check_name: string | null
          qbo_sync_token: string | null
          qbo_vendor_id: string | null
          updated_at: string | null
          vendor_1099: boolean | null
          web_addr: string | null
        }
        Insert: {
          acct_num?: string | null
          balance?: number | null
          bill_addr?: Json | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          print_on_check_name?: string | null
          qbo_sync_token?: string | null
          qbo_vendor_id?: string | null
          updated_at?: string | null
          vendor_1099?: boolean | null
          web_addr?: string | null
        }
        Update: {
          acct_num?: string | null
          balance?: number | null
          bill_addr?: Json | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          print_on_check_name?: string | null
          qbo_sync_token?: string | null
          qbo_vendor_id?: string | null
          updated_at?: string | null
          vendor_1099?: boolean | null
          web_addr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webflow_collections: {
        Row: {
          collection_name: string
          collection_slug: string
          created_at: string | null
          field_schema: Json
          id: string
          integration_id: string
          is_default_for_recruitment: boolean | null
          last_synced_at: string | null
          updated_at: string | null
          webflow_collection_id: string
        }
        Insert: {
          collection_name: string
          collection_slug: string
          created_at?: string | null
          field_schema: Json
          id?: string
          integration_id: string
          is_default_for_recruitment?: boolean | null
          last_synced_at?: string | null
          updated_at?: string | null
          webflow_collection_id: string
        }
        Update: {
          collection_name?: string
          collection_slug?: string
          created_at?: string | null
          field_schema?: Json
          id?: string
          integration_id?: string
          is_default_for_recruitment?: boolean | null
          last_synced_at?: string | null
          updated_at?: string | null
          webflow_collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webflow_collections_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_actions: {
        Row: {
          action_config: Json
          action_order: number
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          timeout_ms: number | null
          updated_at: string
          webhook_id: string
        }
        Insert: {
          action_config: Json
          action_order: number
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          timeout_ms?: number | null
          updated_at?: string
          webhook_id: string
        }
        Update: {
          action_config?: Json
          action_order?: number
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          timeout_ms?: number | null
          updated_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_actions_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_execution_logs: {
        Row: {
          actions_executed: Json | null
          error_message: string | null
          execution_duration_ms: number | null
          id: string
          related_action_result_ids: string[] | null
          related_integration_log_ids: string[] | null
          request_headers: Json | null
          request_payload: Json
          server_logs: Json | null
          status: string
          triggered_at: string
          webhook_id: string
        }
        Insert: {
          actions_executed?: Json | null
          error_message?: string | null
          execution_duration_ms?: number | null
          id?: string
          related_action_result_ids?: string[] | null
          related_integration_log_ids?: string[] | null
          request_headers?: Json | null
          request_payload: Json
          server_logs?: Json | null
          status: string
          triggered_at?: string
          webhook_id: string
        }
        Update: {
          actions_executed?: Json | null
          error_message?: string | null
          execution_duration_ms?: number | null
          id?: string
          related_action_result_ids?: string[] | null
          related_integration_log_ids?: string[] | null
          request_headers?: Json | null
          request_payload?: Json
          server_logs?: Json | null
          status?: string
          triggered_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_execution_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_payload_samples: {
        Row: {
          detected_fields: Json | null
          id: string
          payload: Json
          received_at: string
          webhook_id: string
        }
        Insert: {
          detected_fields?: Json | null
          id?: string
          payload: Json
          received_at?: string
          webhook_id: string
        }
        Update: {
          detected_fields?: Json | null
          id?: string
          payload?: Json
          received_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_payload_samples_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          allowed_ips: string[] | null
          api_key: string | null
          api_key_created_at: string | null
          api_key_last_used_at: string | null
          api_key_prefix: string | null
          blocked_ips: string[] | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          integration_type: string | null
          ip_filtering_enabled: boolean | null
          ip_filtering_mode: string | null
          is_active: boolean
          last_triggered_at: string | null
          name: string
          rate_limit_burst: number | null
          rate_limit_enabled: boolean | null
          rate_limit_requests_per_minute: number | null
          require_auth: boolean | null
          trigger_count: number
          updated_at: string
          webhook_url_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          api_key?: string | null
          api_key_created_at?: string | null
          api_key_last_used_at?: string | null
          api_key_prefix?: string | null
          blocked_ips?: string[] | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          integration_type?: string | null
          ip_filtering_enabled?: boolean | null
          ip_filtering_mode?: string | null
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          rate_limit_burst?: number | null
          rate_limit_enabled?: boolean | null
          rate_limit_requests_per_minute?: number | null
          require_auth?: boolean | null
          trigger_count?: number
          updated_at?: string
          webhook_url_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          api_key?: string | null
          api_key_created_at?: string | null
          api_key_last_used_at?: string | null
          api_key_prefix?: string | null
          blocked_ips?: string[] | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          integration_type?: string | null
          ip_filtering_enabled?: boolean | null
          ip_filtering_mode?: string | null
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          rate_limit_burst?: number | null
          rate_limit_enabled?: boolean | null
          rate_limit_requests_per_minute?: number | null
          require_auth?: boolean | null
          trigger_count?: number
          updated_at?: string
          webhook_url_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hd_integration_health: {
        Row: {
          error_count: number | null
          id: number | null
          integration_type: string | null
          last_error: string | null
          last_sync_at: string | null
          mailbox_email: string | null
          modified_at: string | null
          name: string | null
          status: string | null
          token_expires_at: string | null
          token_minutes_until_expiry: number | null
          token_status: string | null
          webhook_expires_at: string | null
          webhook_hours_until_expiry: number | null
          webhook_status: string | null
          webhook_subscription_id: string | null
        }
        Insert: {
          error_count?: number | null
          id?: number | null
          integration_type?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          mailbox_email?: string | null
          modified_at?: string | null
          name?: string | null
          status?: string | null
          token_expires_at?: string | null
          token_minutes_until_expiry?: never
          token_status?: never
          webhook_expires_at?: string | null
          webhook_hours_until_expiry?: never
          webhook_status?: never
          webhook_subscription_id?: string | null
        }
        Update: {
          error_count?: number | null
          id?: number | null
          integration_type?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          mailbox_email?: string | null
          modified_at?: string | null
          name?: string | null
          status?: string | null
          token_expires_at?: string | null
          token_minutes_until_expiry?: never
          token_status?: never
          webhook_expires_at?: string | null
          webhook_hours_until_expiry?: never
          webhook_status?: never
          webhook_subscription_id?: string | null
        }
        Relationships: []
      }
      v_failed_email_processing: {
        Row: {
          created_at: string | null
          id: number | null
          integration_name: string | null
          last_retry_at: string | null
          mailbox_email: string | null
          message_id: string | null
          processing_error: string | null
          retry_count: number | null
          sender_email: string | null
          subject: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _get_storage_object_name: {
        Args: { bucket_name: string; object_id: string }
        Returns: string
      }
      acknowledge_alert: { Args: { alert_id: number }; Returns: undefined }
      advance_invoice_sequence_if_needed: {
        Args: { target: number }
        Returns: undefined
      }
      assign_next_invoice_number: { Args: { prefix?: string }; Returns: string }
      check_and_trigger_stat_holidays_sync: { Args: never; Returns: undefined }
      check_microsoft_token_health: { Args: never; Returns: undefined }
      cleanup_stale_presence: {
        Args: never
        Returns: {
          error_message: string
          execution_time: number
          updated_agents: number
        }[]
      }
      create_renewal_estimate: {
        Args: {
          new_estimate_data: Json
          source_estimate_id: string
          today: string
        }
        Returns: string
      }
      generate_contract_number: { Args: never; Returns: string }
      generate_estimate_number: { Args: never; Returns: string }
      get_active_linkedin_destinations: {
        Args: never
        Returns: {
          client_id: string
          created_by: string
          id: string
          integration_type: string
          linkedin_id: string
          linkedin_name: string
        }[]
      }
      get_agent_for_user: { Args: { user_id: string }; Returns: string }
      get_agent_tickets: {
        Args: { agent_name: string; status_filter?: string }
        Returns: {
          created_at: string
          customer: string
          first_responded_on: string
          name: string
          priority: string
          sla_status: string
          status: string
          subject: string
        }[]
      }
      get_latest_revision: {
        Args: { p_base_estimate_number: string }
        Returns: {
          id: string
        }[]
      }
      get_renewal_chain: {
        Args: { p_estimate_id: string }
        Returns: {
          created_at: string
          estimate_id: string
          estimate_number: string
          level: number
          status: string
        }[]
      }
      get_ticket_metrics: {
        Args: { from_date: string; to_date: string }
        Returns: {
          avg_resolution_hours: number
          avg_response_hours: number
          closed_tickets: number
          open_tickets: number
          total_tickets: number
        }[]
      }
      get_ticket_sla_status: {
        Args: { ticket_id: string }
        Returns: {
          hours_to_resolution: number
          hours_to_response: number
          resolution_breached: boolean
          response_breached: boolean
          status: string
        }[]
      }
      get_unprocessed_emails_for_processing: {
        Args: { limit_count?: number }
        Returns: {
          conversation_id: string
          id: number
          integration_id: number
          internet_message_id: string
          message_id: string
          processed: boolean
          processing: boolean
          raw_data: Json
          received_at: string
          retry_count: number
          sender_email: string
          sender_name: string
          subject: string
          thread_hash: string
        }[]
      }
      get_user_org_id: { Args: never; Returns: string }
      get_user_teams: {
        Args: { user_id: string }
        Returns: {
          team_id: string
          team_name: string
        }[]
      }
      has_permission: {
        Args: { p_required_level: number; p_section_name: string }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      is_agent: { Args: { user_id: string }; Returns: boolean }
      log_ticket_activity: {
        Args: { action_text: string; action_type?: string; ticket_id: string }
        Returns: number
      }
      query_user_by_contact: {
        Args: { p_email: string; p_phone: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }[]
      }
      refresh_expiring_microsoft_tokens: { Args: never; Returns: undefined }
      refresh_integration_token: {
        Args: {
          p_integration_id: string
          p_new_access_token: string
          p_new_expires_at: string
          p_new_refresh_token: string
        }
        Returns: {
          current_expires_at: string
          locked_by_another_process: boolean
          success: boolean
        }[]
      }
      search_tickets: {
        Args: { search_query: string }
        Returns: {
          created_at: string
          name: string
          priority: string
          relevance: number
          status: string
          subject: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_user_auth_id: {
        Args: { p_auth_id: string; p_phone: string }
        Returns: boolean
      }
      update_form_questions_atomic: {
        Args: { p_questions_data: Json; p_template_id: string }
        Returns: undefined
      }
      update_form_submission_with_user: {
        Args: {
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_middle_name?: string
          p_status?: string
          p_submission_id: string
          p_user_id: string
        }
        Returns: {
          candidate_email: string
          candidate_first_name: string
          candidate_last_name: string
          candidate_middle_name: string
          id: string
          status: string
        }[]
      }
      user_on_team: {
        Args: { team_name: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

