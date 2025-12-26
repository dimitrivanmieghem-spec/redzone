// Octane98 - Types Supabase
// Synchronisé avec supabase/MASTER_SCHEMA_V2.sql

import type { UserRole } from "@/lib/permissions";

export type Vehicule = Database['public']['Tables']['vehicles']['Row'];
export type VehiculeInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehiculeUpdate = Database['public']['Tables']['vehicles']['Update'];

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          created_at: string;
          owner_id: string | null; // ID du propriétaire (utilisateur connecté ou null pour invité)
          type: "car" | "moto";
          brand: string; // Marque (anglais)
          model: string; // Modèle (anglais)
          price: number; // Prix (anglais)
          year: number; // Année (anglais)
          mileage: number; // Kilométrage (anglais)
          fuel_type: "essence" | "e85" | "lpg"; // Type de carburant (anglais)
          transmission: "manuelle" | "automatique" | "sequentielle";
          body_type: string | null; // Type de carrosserie (anglais)
          power_hp: number; // Puissance en chevaux (anglais)
          condition: "Neuf" | "Occasion"; // État (anglais)
          euro_standard: string; // Norme Euro (anglais)
          car_pass: boolean;
          image: string;
          images: string[] | null; // Tableau d'images (peut être null)
          description: string | null;
          status: "pending" | "active" | "rejected" | "waiting_email_verification" | "pending_validation";
          
          // Vérification email (pour invités)
          guest_email: string | null; // Email de contact pour les invités
          is_email_verified: boolean; // DEFAULT FALSE dans SQL
          verification_code: string | null; // Code de vérification hashé
          verification_code_expires_at: string | null; // Date d'expiration du code
          edit_token: string | null; // UUID pour permettre modification/suppression annonces invitées
          
          // Champs techniques
          engine_architecture: string | null; // Architecture moteur (anglais)
          admission: string | null;
          zero_a_cent: number | null;
          co2: number | null;
          poids_kg: number | null;
          fiscal_horsepower: number | null; // Chevaux fiscaux (anglais)
          
          // Passion & Transparence
          audio_file: string | null;
          history: string[] | null;
          car_pass_url: string | null; // Lien Car-Pass (URL)
          is_manual_model: boolean; // DEFAULT FALSE dans SQL
          
          // Contact
          phone: string | null; // Numéro de téléphone du vendeur (anglais)
          contact_email: string | null; // Email de contact (par défaut email du vendeur)
          contact_methods: string[] | null; // Méthodes de contact acceptées: 'whatsapp', 'email', 'tel'
          
          // Filtres avancés
          interior_color: string | null; // Couleur intérieure (anglais)
          seats_count: number | null; // Nombre de places (anglais)
          
          // Localisation
          city: string | null; // Ville où se trouve le véhicule (anglais)
          postal_code: string | null; // Code postal belge (anglais)
          
          // Champs pour calcul taxes belges (CRITIQUES)
          displacement_cc: number | null; // Cylindrée en cm³ - OBLIGATOIRE pour calcul CV fiscaux
          co2_wltp: number | null; // Émissions CO2 WLTP - RECOMMANDÉ pour Flandre
          first_registration_date: string | null; // Date de première immatriculation (DATE dans SQL)
          is_hybrid: boolean | null; // Véhicule hybride - Réduction taxes Flandre (50%)
          is_electric: boolean | null; // Véhicule électrique - Exemption taxes Flandre
          region_of_registration: "wallonie" | "flandre" | "bruxelles" | null; // Région d'immatriculation
          
          // Champs pour véhicules sportifs
          drivetrain: "RWD" | "FWD" | "AWD" | "4WD" | null; // Type de transmission
          top_speed: number | null; // Vitesse maximale en km/h
          torque_nm: number | null; // Couple moteur en Newton-mètres (Nm)
          engine_configuration: string | null; // Configuration moteur (V6, V8, V12, I4, I6, Boxer, etc.)
          number_of_cylinders: number | null; // Nombre de cylindres
          redline_rpm: number | null; // Régime de rupture en tr/min
          limited_edition: boolean | null; // Édition limitée
          number_produced: number | null; // Nombre d'exemplaires produits
          racing_heritage: string | null; // Héritage sportif (ex: "Le Mans Winner", "F1 Technology")
          modifications: string[] | null; // Liste des modifications
          track_ready: boolean | null; // Prêt pour circuit
          warranty_remaining: number | null; // Garantie restante en mois
          service_history_count: number | null; // Nombre d'entretiens documentés
        };
        Insert: {
          id?: string;
          created_at?: string;
          owner_id?: string | null;
          type: "car" | "moto";
          brand: string;
          model: string;
          price: number;
          year: number;
          mileage: number;
          fuel_type: "essence" | "e85" | "lpg";
          transmission: "manuelle" | "automatique" | "sequentielle";
          body_type?: string | null;
          power_hp: number;
          condition: "Neuf" | "Occasion";
          euro_standard: string;
          car_pass?: boolean;
          image: string;
          images?: string[] | null;
          description?: string | null;
          status?: "pending" | "active" | "rejected" | "waiting_email_verification" | "pending_validation";
          guest_email?: string | null;
          is_email_verified?: boolean;
          verification_code?: string | null;
          verification_code_expires_at?: string | null;
          edit_token?: string | null;
          engine_architecture?: string | null;
          admission?: string | null;
          zero_a_cent?: number | null;
          co2?: number | null;
          poids_kg?: number | null;
          fiscal_horsepower?: number | null;
          audio_file?: string | null;
          history?: string[] | null;
          car_pass_url?: string | null;
          is_manual_model?: boolean;
          phone?: string | null;
          contact_email?: string | null;
          contact_methods?: string[] | null;
          interior_color?: string | null;
          seats_count?: number | null;
          city?: string | null;
          postal_code?: string | null;
          displacement_cc?: number | null;
          co2_wltp?: number | null;
          first_registration_date?: string | null;
          is_hybrid?: boolean | null;
          is_electric?: boolean | null;
          region_of_registration?: "wallonie" | "flandre" | "bruxelles" | null;
          drivetrain?: "RWD" | "FWD" | "AWD" | "4WD" | null;
          top_speed?: number | null;
          torque_nm?: number | null;
          engine_configuration?: string | null;
          number_of_cylinders?: number | null;
          redline_rpm?: number | null;
          limited_edition?: boolean | null;
          number_produced?: number | null;
          racing_heritage?: string | null;
          modifications?: string[] | null;
          track_ready?: boolean | null;
          warranty_remaining?: number | null;
          service_history_count?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          owner_id?: string | null;
          type?: "car" | "moto";
          brand?: string;
          model?: string;
          price?: number;
          year?: number;
          mileage?: number;
          fuel_type?: "essence" | "e85" | "lpg";
          transmission?: "manuelle" | "automatique" | "sequentielle";
          body_type?: string | null;
          power_hp?: number;
          condition?: "Neuf" | "Occasion";
          euro_standard?: string;
          car_pass?: boolean;
          image?: string;
          images?: string[] | null;
          description?: string | null;
          status?: "pending" | "active" | "rejected" | "waiting_email_verification" | "pending_validation";
          guest_email?: string | null;
          is_email_verified?: boolean;
          verification_code?: string | null;
          verification_code_expires_at?: string | null;
          edit_token?: string | null;
          engine_architecture?: string | null;
          admission?: string | null;
          zero_a_cent?: number | null;
          co2?: number | null;
          poids_kg?: number | null;
          fiscal_horsepower?: number | null;
          audio_file?: string | null;
          history?: string[] | null;
          car_pass_url?: string | null;
          is_manual_model?: boolean;
          phone?: string | null;
          contact_email?: string | null;
          contact_methods?: string[] | null;
          interior_color?: string | null;
          seats_count?: number | null;
          city?: string | null;
          postal_code?: string | null;
          displacement_cc?: number | null;
          co2_wltp?: number | null;
          first_registration_date?: string | null;
          is_hybrid?: boolean | null;
          is_electric?: boolean | null;
          region_of_registration?: "wallonie" | "flandre" | "bruxelles" | null;
          drivetrain?: "RWD" | "FWD" | "AWD" | "4WD" | null;
          top_speed?: number | null;
          torque_nm?: number | null;
          engine_configuration?: string | null;
          number_of_cylinders?: number | null;
          redline_rpm?: number | null;
          limited_edition?: boolean | null;
          number_produced?: number | null;
          racing_heritage?: string | null;
          modifications?: string[] | null;
          track_ready?: boolean | null;
          warranty_remaining?: number | null;
          service_history_count?: number | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          full_name: string | null;
          role: UserRole; // 7 rôles: particulier, pro, admin, moderator, support, editor, viewer
          avatar_url: string | null;
          is_banned: boolean; // DEFAULT FALSE dans SQL
          ban_reason: string | null;
          ban_until: string | null;
          garage_name: string | null;
          garage_description: string | null;
          website: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          phone: string | null;
          bio: string | null;
          speciality: string | null;
          founded_year: number | null;
          cover_image_url: string | null;
          is_verified: boolean; // DEFAULT FALSE dans SQL
          is_founder: boolean; // DEFAULT FALSE dans SQL - Badge Membre Fondateur (500 premiers)
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          is_banned?: boolean;
          ban_reason?: string | null;
          ban_until?: string | null;
          garage_name?: string | null;
          garage_description?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          bio?: string | null;
          speciality?: string | null;
          founded_year?: number | null;
          cover_image_url?: string | null;
          is_verified?: boolean;
          is_founder?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          is_banned?: boolean;
          ban_reason?: string | null;
          ban_until?: string | null;
          garage_name?: string | null;
          garage_description?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          bio?: string | null;
          speciality?: string | null;
          founded_year?: number | null;
          cover_image_url?: string | null;
          is_verified?: boolean;
          is_founder?: boolean;
        };
      };
      conversations: {
        Row: {
          id: string;
          vehicle_id: string;
          buyer_id: string;
          seller_id: string;
          created_at: string;
          updated_at: string;
          buyer_last_read_at: string | null;
          seller_last_read_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          buyer_id: string;
          seller_id: string;
          created_at?: string;
          updated_at?: string;
          buyer_last_read_at?: string | null;
          seller_last_read_at?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          buyer_id?: string;
          seller_id?: string;
          created_at?: string;
          updated_at?: string;
          buyer_last_read_at?: string | null;
          seller_last_read_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          is_read: boolean; // DEFAULT FALSE dans SQL
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          is_read?: boolean;
          read_at?: string | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string | null; // Nullable pour les invités
          email_contact: string;
          subject: "bug" | "question" | "signalement" | "autre";
          category: "Technique" | "Contenu" | "Commercial";
          message: string;
          user_reply: string | null;
          status: "open" | "in_progress" | "resolved" | "closed"; // DEFAULT 'open'
          assigned_to: "admin" | "moderator"; // DEFAULT 'admin'
          admin_notes: string | null; // Notes internes pour l'admin
          admin_reply: string | null; // Réponse visible par l'utilisateur
          resolved_at: string | null;
          resolved_by: string | null;
          closed_at: string | null;
          closed_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          email_contact: string;
          subject: "bug" | "question" | "signalement" | "autre";
          category: "Technique" | "Contenu" | "Commercial";
          message: string;
          user_reply?: string | null;
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: "admin" | "moderator";
          admin_notes?: string | null;
          admin_reply?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          email_contact?: string;
          subject?: "bug" | "question" | "signalement" | "autre";
          category?: "Technique" | "Contenu" | "Commercial";
          message?: string;
          user_reply?: string | null;
          status?: "open" | "in_progress" | "resolved" | "closed";
          assigned_to?: "admin" | "moderator";
          admin_notes?: string | null;
          admin_reply?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: "info" | "success" | "error";
          title: string;
          message: string;
          link: string | null;
          is_read: boolean; // DEFAULT FALSE dans SQL
          read_at: string | null;
          metadata: Record<string, any>; // JSONB DEFAULT '{}'::jsonb
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          type: "info" | "success" | "error";
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          type?: "info" | "success" | "error";
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          metadata?: Record<string, any>;
        };
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          marque: string | null;
          modele: string | null;
          prix_min: number | null;
          prix_max: number | null;
          annee_min: number | null;
          annee_max: number | null;
          km_max: number | null;
          type: string[] | null;
          carburants: string[] | null;
          transmissions: string[] | null;
          carrosseries: string[] | null;
          norme_euro: string | null;
          car_pass_only: boolean; // DEFAULT FALSE dans SQL
          architectures: string[] | null;
          admissions: string[] | null;
          couleur_exterieure: string[] | null;
          couleur_interieure: string[] | null;
          nombre_places: string[] | null;
          name: string | null;
          is_active: boolean; // DEFAULT TRUE dans SQL
          last_notified_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          marque?: string | null;
          modele?: string | null;
          prix_min?: number | null;
          prix_max?: number | null;
          annee_min?: number | null;
          annee_max?: number | null;
          km_max?: number | null;
          type?: string[] | null;
          carburants?: string[] | null;
          transmissions?: string[] | null;
          carrosseries?: string[] | null;
          norme_euro?: string | null;
          car_pass_only?: boolean;
          architectures?: string[] | null;
          admissions?: string[] | null;
          couleur_exterieure?: string[] | null;
          couleur_interieure?: string[] | null;
          nombre_places?: string[] | null;
          name?: string | null;
          is_active?: boolean;
          last_notified_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          marque?: string | null;
          modele?: string | null;
          prix_min?: number | null;
          prix_max?: number | null;
          annee_min?: number | null;
          annee_max?: number | null;
          km_max?: number | null;
          type?: string[] | null;
          carburants?: string[] | null;
          transmissions?: string[] | null;
          carrosseries?: string[] | null;
          norme_euro?: string | null;
          car_pass_only?: boolean;
          architectures?: string[] | null;
          admissions?: string[] | null;
          couleur_exterieure?: string[] | null;
          couleur_interieure?: string[] | null;
          nombre_places?: string[] | null;
          name?: string | null;
          is_active?: boolean;
          last_notified_at?: string | null;
        };
      };
      articles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          slug: string;
          content: string;
          main_image_url: string | null;
          post_type: "question" | "presentation" | "article" | null;
          author_id: string;
          status: "draft" | "pending" | "published" | "archived"; // DEFAULT 'draft'
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          slug: string;
          content: string;
          main_image_url?: string | null;
          post_type?: "question" | "presentation" | "article" | null;
          author_id: string;
          status?: "draft" | "pending" | "published" | "archived";
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          slug?: string;
          content?: string;
          main_image_url?: string | null;
          post_type?: "question" | "presentation" | "article" | null;
          author_id?: string;
          status?: "draft" | "pending" | "published" | "archived";
        };
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          article_id: string;
          user_id: string;
          content: string;
          status: "pending" | "approved" | "rejected"; // DEFAULT 'pending'
        };
        Insert: {
          id?: string;
          created_at?: string;
          article_id: string;
          user_id: string;
          content: string;
          status?: "pending" | "approved" | "rejected";
        };
        Update: {
          id?: string;
          created_at?: string;
          article_id?: string;
          user_id?: string;
          content?: string;
          status?: "pending" | "approved" | "rejected";
        };
      };
      faq_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          question: string;
          answer: string;
          order: number; // DEFAULT 0 dans SQL (colonne "order" avec guillemets)
          is_active: boolean; // DEFAULT TRUE dans SQL
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          question: string;
          answer: string;
          order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          question?: string;
          answer?: string;
          order?: number;
          is_active?: boolean;
        };
      };
      site_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          banner_message: string; // DEFAULT 'Bienvenue sur Octane98'
          maintenance_mode: boolean; // DEFAULT FALSE
          tva_rate: number; // NUMERIC(5, 2) DEFAULT 21.00
          home_title: string; // DEFAULT 'Le Sanctuaire du Moteur Thermique'
          site_name: string; // DEFAULT 'Octane98'
          site_description: string; // DEFAULT 'Le sanctuaire du moteur thermique'
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          banner_message?: string;
          maintenance_mode?: boolean;
          tva_rate?: number;
          home_title?: string;
          site_name?: string;
          site_description?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          banner_message?: string;
          maintenance_mode?: boolean;
          tva_rate?: number;
          home_title?: string;
          site_name?: string;
          site_description?: string;
        };
      };
      app_logs: {
        Row: {
          id: string;
          created_at: string;
          level: "error" | "info" | "warning";
          user_id: string | null;
          message: string;
          metadata: Record<string, any>; // JSONB DEFAULT '{}'::jsonb
        };
        Insert: {
          id?: string;
          created_at?: string;
          level: "error" | "info" | "warning";
          user_id?: string | null;
          message: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          level?: "error" | "info" | "warning";
          user_id?: string | null;
          message?: string;
          metadata?: Record<string, any>;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          user_email: string | null; // Email pour traçabilité même si user_id est supprimé
          action_type: 
            | "data_access"
            | "data_export"
            | "data_deletion"
            | "data_modification"
            | "login_attempt"
            | "failed_login"
            | "password_reset"
            | "profile_update"
            | "unauthorized_access"
            | "data_export_request";
          resource_type: string | null; // Ex: 'profile', 'vehicule', 'message', 'favorite'
          resource_id: string | null;
          description: string;
          ip_address: string | null; // INET dans SQL
          user_agent: string | null;
          metadata: Record<string, any>; // JSONB DEFAULT '{}'
          status: "success" | "failed" | "blocked"; // DEFAULT 'success'
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          user_email?: string | null;
          action_type: 
            | "data_access"
            | "data_export"
            | "data_deletion"
            | "data_modification"
            | "login_attempt"
            | "failed_login"
            | "password_reset"
            | "profile_update"
            | "unauthorized_access"
            | "data_export_request";
          resource_type?: string | null;
          resource_id?: string | null;
          description: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any>;
          status?: "success" | "failed" | "blocked";
          error_message?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          user_email?: string | null;
          action_type?: 
            | "data_access"
            | "data_export"
            | "data_deletion"
            | "data_modification"
            | "login_attempt"
            | "failed_login"
            | "password_reset"
            | "profile_update"
            | "unauthorized_access"
            | "data_export_request";
          resource_type?: string | null;
          resource_id?: string | null;
          description?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, any>;
          status?: "success" | "failed" | "blocked";
          error_message?: string | null;
        };
      };
      model_specs_db: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          marque: string;
          modele: string;
          type: "car" | "moto";
          kw: number; // NUMERIC(6, 2)
          ch: number; // NUMERIC(6, 2)
          cv_fiscaux: number;
          co2: number | null; // NUMERIC(6, 2)
          cylindree: number;
          moteur: string;
          transmission: "Manuelle" | "Automatique" | "Séquentielle";
          is_active: boolean; // DEFAULT TRUE
          source: string; // DEFAULT 'vehicleData.ts'
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          marque: string;
          modele: string;
          type: "car" | "moto";
          kw: number;
          ch: number;
          cv_fiscaux: number;
          co2?: number | null;
          cylindree: number;
          moteur: string;
          transmission: "Manuelle" | "Automatique" | "Séquentielle";
          is_active?: boolean;
          source?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          marque?: string;
          modele?: string;
          type?: "car" | "moto";
          kw?: number;
          ch?: number;
          cv_fiscaux?: number;
          co2?: number | null;
          cylindree?: number;
          moteur?: string;
          transmission?: "Manuelle" | "Automatique" | "Séquentielle";
          is_active?: boolean;
          source?: string;
        };
      };
    };
  };
}
