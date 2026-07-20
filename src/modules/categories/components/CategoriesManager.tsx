"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buildCategoryTree } from "@/modules/categories/domain/category.rules";
import { deleteCategoryAction } from "@/modules/categories/actions/category.actions";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormDialog } from "./CategoryFormDialog";
import type { CategorySummary } from "@/modules/categories/types";

export function CategoriesManager({ categories }: { categories: CategorySummary[] }) {
  const parents = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));
  const income = categories.filter((c) => c.kind === "INCOME");
  const expense = categories.filter((c) => c.kind === "EXPENSE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Catégories</h2>
          <p className="text-muted-foreground text-sm">
            Organisez vos revenus et dépenses. Les sous-catégories s'affichent en retrait.
          </p>
        </div>
        <CategoryFormDialog
          parents={parents}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Ajouter
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryColumn title="Dépenses" items={expense} parents={parents} />
        <CategoryColumn title="Revenus" items={income} parents={parents} />
      </div>
    </div>
  );
}

function CategoryColumn({
  title,
  items,
  parents,
}: {
  title: string;
  items: CategorySummary[];
  parents: { id: string; name: string; kind: string }[];
}) {
  const tree = buildCategoryTree(items);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune catégorie.</p>
        ) : (
          tree.map(({ node, children }) => (
            <div key={node.id}>
              <CategoryRow category={node} parents={parents} />
              {children.map((child) => (
                <div key={child.id} className="ml-6">
                  <CategoryRow category={child} parents={parents} />
                </div>
              ))}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  category,
  parents,
}: {
  category: CategorySummary;
  parents: { id: string; name: string; kind: string }[];
}) {
  return (
    <div className="hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category.color }}
      >
        <DynamicIcon name={category.icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
      {category.transactionCount > 0 ? (
        <Badge variant="secondary" className="text-xs">
          {category.transactionCount}
        </Badge>
      ) : null}
      <CategoryFormDialog
        category={category}
        parents={parents}
        trigger={
          <Button variant="ghost" size="icon" className="size-7" aria-label="Modifier">
            <Pencil className="size-3.5" />
          </Button>
        }
      />
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-7"
            aria-label="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
        title={`Supprimer « ${category.name} » ?`}
        description="Les transactions liées conservent leur historique mais perdent cette catégorie."
        destructive
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const result = await deleteCategoryAction(category.id);
          if (result.ok) toast.success("Catégorie supprimée.");
          else {
            toast.error(result.error);
            return false;
          }
        }}
      />
    </div>
  );
}
