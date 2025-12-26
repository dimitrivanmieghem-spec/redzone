// Octane98 - Sitemap Dynamique pour SEO
// Next.js génère automatiquement /sitemap.xml depuis ce fichier

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://octane98.be';

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Pages dynamiques : véhicules actifs
  try {
    const supabase = await createClient();
    
    // Récupérer tous les véhicules actifs (uniquement les IDs et dates de mise à jour)
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des véhicules pour le sitemap:', error);
      // Retourner uniquement les pages statiques en cas d'erreur
      return staticPages;
    }

    // Mapper les véhicules en entrées de sitemap
    const vehiclePages: MetadataRoute.Sitemap = (vehicles || []).map((vehicle) => {
      // Utiliser updated_at si disponible, sinon created_at
      const lastModified = vehicle.updated_at 
        ? new Date(vehicle.updated_at)
        : vehicle.created_at 
        ? new Date(vehicle.created_at)
        : new Date();

      return {
        url: `${baseUrl}/cars/${vehicle.id}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7, // Priorité légèrement inférieure aux pages statiques
      };
    });

    // Combiner pages statiques et dynamiques
    return [...staticPages, ...vehiclePages];
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
    // Retourner uniquement les pages statiques en cas d'erreur
    return staticPages;
  }
}

