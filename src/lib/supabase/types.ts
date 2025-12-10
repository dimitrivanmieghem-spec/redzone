// RedZone - Types Supabase

export type Vehicule = Database['public']['Tables']['vehicules']['Row'];
export type VehiculeInsert = Database['public']['Tables']['vehicules']['Insert'];
export type VehiculeUpdate = Database['public']['Tables']['vehicules']['Update'];

export interface Database {
  public: {
    Tables: {
      vehicules: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: "car" | "moto";
          marque: string;
          modele: string;
          prix: number;
          annee: number;
          km: number;
          carburant: "essence" | "e85" | "lpg";
          transmission: "manuelle" | "automatique" | "sequentielle";
          carrosserie: string;
          puissance: number;
          etat: "Neuf" | "Occasion";
          norme_euro: string;
          car_pass: boolean;
          image: string;
          images: string[] | null;
          description: string | null;
          status: "pending" | "active" | "rejected";
          
          // Champs techniques
          architecture_moteur: string | null;
          admission: string | null;
          zero_a_cent: number | null;
          co2: number | null;
          poids_kg: number | null;
          cv_fiscaux: number | null; // Chevaux fiscaux (pour taxe annuelle)
          
          // Passion & Transparence
          audio_file: string | null;
          history: string[] | null;
          car_pass_url: string | null; // Lien Car-Pass (URL)
          is_manual_model: boolean | null; // Modèle non listé (saisie manuelle)
          
          // Contact
          telephone: string | null; // Numéro de téléphone du vendeur
          contact_email: string | null; // Email de contact (par défaut email du vendeur)
          contact_methods: string[] | null; // Méthodes de contact acceptées: 'whatsapp', 'email', 'tel'
          
          // Filtres avancés
          couleur_interieure: string | null; // Couleur intérieure (Noir, Rouge, Cuir Beige, Alcantara)
          nombre_places: number | null; // Nombre de places (2, 4, 5)
          
          // Localisation
          ville: string | null; // Ville où se trouve le véhicule (ex: Namur, Liège, Bruxelles)
          code_postal: string | null; // Code postal belge (ex: 5000, 7181)
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          type: "car" | "moto";
          marque: string;
          modele: string;
          prix: number;
          annee: number;
          km: number;
          carburant: "essence" | "e85" | "lpg";
          transmission: "manuelle" | "automatique" | "sequentielle";
          carrosserie: string;
          puissance: number;
          etat: "Neuf" | "Occasion";
          norme_euro: string;
          car_pass: boolean;
          image: string;
          images?: string[] | null;
          description?: string | null;
          status?: "pending" | "active" | "rejected";
          architecture_moteur?: string | null;
          admission?: string | null;
          zero_a_cent?: number | null;
          co2?: number | null;
          poids_kg?: number | null;
          cv_fiscaux?: number | null;
          audio_file?: string | null;
          history?: string[] | null;
          car_pass_url?: string | null;
          is_manual_model?: boolean | null;
          telephone?: string | null;
          contact_email?: string | null;
          contact_methods?: string[] | null;
          couleur_interieure?: string | null;
          nombre_places?: number | null;
          ville?: string | null;
          code_postal?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          type?: "car" | "moto";
          marque?: string;
          modele?: string;
          prix?: number;
          annee?: number;
          km?: number;
          carburant?: "essence" | "e85" | "lpg";
          transmission?: "manuelle" | "automatique" | "sequentielle";
          carrosserie?: string;
          puissance?: number;
          etat?: "Neuf" | "Occasion";
          norme_euro?: string;
          car_pass?: boolean;
          image?: string;
          images?: string[] | null;
          description?: string | null;
          status?: "pending" | "active" | "rejected";
          architecture_moteur?: string | null;
          admission?: string | null;
          zero_a_cent?: number | null;
          co2?: number | null;
          poids_kg?: number | null;
          cv_fiscaux?: number | null;
          audio_file?: string | null;
          history?: string[] | null;
          car_pass_url?: string | null;
          is_manual_model?: boolean | null;
          telephone?: string | null;
          contact_email?: string | null;
          contact_methods?: string[] | null;
          couleur_interieure?: string | null;
          nombre_places?: number | null;
          ville?: string | null;
          code_postal?: string | null;
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
          author_id: string;
          status: "draft" | "pending" | "published" | "archived";
          post_type: "question" | "presentation" | "article" | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          slug: string;
          content: string;
          main_image_url?: string | null;
          author_id: string;
          status?: "draft" | "pending" | "published" | "archived";
          post_type?: "question" | "presentation" | "article" | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          slug?: string;
          content?: string;
          main_image_url?: string | null;
          author_id?: string;
          status?: "draft" | "pending" | "published" | "archived";
          post_type?: "question" | "presentation" | "article" | null;
        };
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          article_id: string;
          user_id: string;
          content: string;
          status: "pending" | "approved" | "rejected";
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
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          full_name: string | null;
          role: "particulier" | "pro" | "admin";
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          full_name?: string | null;
          role?: "particulier" | "pro" | "admin";
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          role?: "particulier" | "pro" | "admin";
          avatar_url?: string | null;
        };
      };
      site_settings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          banner_message: string;
          maintenance_mode: boolean;
          tva_rate: number;
          site_name: string;
          site_description: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          banner_message?: string;
          maintenance_mode?: boolean;
          tva_rate?: number;
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
          metadata: Record<string, any>;
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
    };
  };
}

