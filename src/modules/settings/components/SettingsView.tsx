"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { CategoriesManager } from "@/modules/categories";
import type { CategorySummary } from "@/modules/categories";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { DangerZone } from "./DangerZone";
import type { ProfileInput } from "@/modules/settings/schemas";

export function SettingsView({
  profile,
  categories,
}: {
  profile: ProfileInput;
  categories: CategorySummary[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Paramètres</h1>
        <p className="text-muted-foreground">Profil, préférences, catégories et données.</p>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="apparence">Apparence</TabsTrigger>
          <TabsTrigger value="donnees">Données</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil & préférences</CardTitle>
              <CardDescription>Nom, devise, fuseau horaire et format de date.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm defaults={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesManager categories={categories} />
        </TabsContent>

        <TabsContent value="apparence" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thème</CardTitle>
              <CardDescription>
                Choisissez l'ambiance visuelle et le mode clair/sombre.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <ThemeSwitcher />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Clair / sombre</span>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donnees" className="mt-4">
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
}
