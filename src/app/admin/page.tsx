/**
 * ⚠️ MISE À JOUR DE L'EMAIL ADMINISTRATEUR DANS SUPABASE
 * 
 * Pour mettre à jour l'email de l'administrateur dans la base de données Supabase,
 * exécutez ce script dans le SQL Editor de Supabase :
 * 
 * ```sql
 * -- 1. Mettre à jour l'email dans auth.users
 * UPDATE auth.users
 * SET email = 'admin@octane98.be',
 *     email_confirmed_at = NOW(),
 *     updated_at = NOW()
 * WHERE email = 'dimitri.vanmieghem@gmail.com';
 * 
 * -- 2. Mettre à jour l'email dans public.profiles
 * UPDATE public.profiles
 * SET email = 'admin@octane98.be',
 *     updated_at = NOW()
 * WHERE email = 'dimitri.vanmieghem@gmail.com';
 * 
 * -- 3. Vérifier que la mise à jour a bien fonctionné
 * SELECT id, email, role, created_at
 * FROM public.profiles
 * WHERE email = 'admin@octane98.be';
 * 
 * -- 4. (Optionnel) Vérifier dans auth.users
 * SELECT id, email, email_confirmed_at
 * FROM auth.users
 * WHERE email = 'admin@octane98.be';
 * ```
 * 
 * ⚠️ IMPORTANT : 
 * - Assurez-vous que le compte admin@octane98.be existe dans Supabase Auth avant d'exécuter
 * - Ou créez-le d'abord via le Dashboard Supabase > Authentication > Add User
 * - Cette opération est irréversible, vérifiez bien l'email avant d'exécuter
 */

import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
