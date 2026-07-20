/**
 * Demo seed for Rapiat. Idempotent: if the demo user already exists it does
 * nothing. Creates one user (OWNER of their own data), the default categories,
 * a checking account, a couple of months of transactions (income + fixed and
 * variable expenses), one recurring rule, one budget and one savings goal — so
 * the dashboard, budgets and reports are populated out of the box.
 *
 * Run with `pnpm db:seed`. Uses a relative import (tsx has no `@/` alias) and
 * builds its own Prisma client via the Neon driver adapter.
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { subMonths, startOfMonth, setDate } from "date-fns";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL manquant — impossible de seed.");
}

const adapter = new PrismaNeon({ connectionString });
const db = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@rapiat.ch";
const DEMO_PASSWORD = "Demo1234!";

// Inlined default categories (kept in sync with src/config/default-categories.ts).
const CATEGORIES: { name: string; kind: "INCOME" | "EXPENSE"; color: string; icon: string }[] = [
  { name: "Salaire", kind: "INCOME", color: "#2f9e6f", icon: "banknote" },
  { name: "Primes & bonus", kind: "INCOME", color: "#4bbf8a", icon: "gift" },
  { name: "Revenus divers", kind: "INCOME", color: "#7bd3b0", icon: "coins" },
  { name: "Logement", kind: "EXPENSE", color: "#1e2a4a", icon: "home" },
  { name: "Alimentation", kind: "EXPENSE", color: "#c9a227", icon: "shopping-cart" },
  { name: "Transport", kind: "EXPENSE", color: "#3f6db0", icon: "car" },
  { name: "Loisirs", kind: "EXPENSE", color: "#e6a4b4", icon: "party-popper" },
  { name: "Santé", kind: "EXPENSE", color: "#e0685f", icon: "heart-pulse" },
  { name: "Abonnements", kind: "EXPENSE", color: "#8b5cf6", icon: "repeat" },
  { name: "Restaurants & sorties", kind: "EXPENSE", color: "#f0913f", icon: "utensils" },
  { name: "Divers", kind: "EXPENSE", color: "#6b7280", icon: "ellipsis" },
];

async function main(): Promise<void> {
  const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.info(`Le compte de démo (${DEMO_EMAIL}) existe déjà — seed ignoré.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await db.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Marie Démo",
      passwordHash,
      currency: "CHF",
      timezone: "Europe/Zurich",
    },
  });

  await db.category.createMany({
    data: CATEGORIES.map((c) => ({ ...c, userId: user.id, isDefault: true })),
  });
  const cats = await db.category.findMany({ where: { userId: user.id } });
  const catId = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

  const account = await db.account.create({
    data: {
      userId: user.id,
      name: "Compte courant",
      type: "CHECKING",
      initialBalanceCents: 250_000,
      currency: "CHF",
      color: "#1e2a4a",
      icon: "wallet",
    },
  });

  const savings = await db.account.create({
    data: {
      userId: user.id,
      name: "Épargne",
      type: "SAVINGS",
      initialBalanceCents: 500_000,
      currency: "CHF",
      color: "#2f9e6f",
      icon: "piggy-bank",
    },
  });

  const now = new Date();
  const monthOffsets = [2, 1, 0];
  const salary = catId("Salaire");
  const logement = catId("Logement");
  const alimentation = catId("Alimentation");
  const loisirs = catId("Loisirs");
  const transport = catId("Transport");

  for (const offset of monthOffsets) {
    const base = startOfMonth(subMonths(now, offset));
    const salaryDate = setDate(base, 25);
    const rentDate = setDate(base, 1);
    const groceriesDate = setDate(base, 8);
    const funDate = setDate(base, 15);
    const transportDate = setDate(base, 10);

    await db.transaction.createMany({
      data: [
        {
          userId: user.id,
          accountId: account.id,
          categoryId: salary,
          type: "INCOME",
          amountCents: 620_000,
          date: salaryDate,
          note: "Salaire",
        },
        {
          userId: user.id,
          accountId: account.id,
          categoryId: logement,
          type: "EXPENSE",
          expenseKind: "FIXED",
          amountCents: 145_000,
          date: rentDate,
          note: "Loyer",
        },
        {
          userId: user.id,
          accountId: account.id,
          categoryId: alimentation,
          type: "EXPENSE",
          expenseKind: "VARIABLE",
          amountCents: 38_500,
          date: groceriesDate,
          note: "Courses",
        },
        {
          userId: user.id,
          accountId: account.id,
          categoryId: loisirs,
          type: "EXPENSE",
          expenseKind: "VARIABLE",
          amountCents: 12_000,
          date: funDate,
          note: "Cinéma & sorties",
        },
        {
          userId: user.id,
          accountId: account.id,
          categoryId: transport,
          type: "EXPENSE",
          expenseKind: "VARIABLE",
          amountCents: 8_000,
          date: transportDate,
          note: "Transports",
        },
      ],
    });
  }

  // A transfer to savings this month.
  await db.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      transferAccountId: savings.id,
      type: "TRANSFER",
      amountCents: 50_000,
      date: setDate(startOfMonth(now), 26),
      note: "Virement épargne",
    },
  });

  // Recurring: rent (fixed expense) and salary (income).
  const nextMonthFirst = setDate(startOfMonth(subMonths(now, -1)), 1);
  await db.recurringRule.createMany({
    data: [
      {
        userId: user.id,
        accountId: account.id,
        categoryId: logement,
        type: "EXPENSE",
        expenseKind: "FIXED",
        amountCents: 145_000,
        frequency: "MONTHLY",
        interval: 1,
        nextRunDate: nextMonthFirst,
        label: "Loyer",
      },
      {
        userId: user.id,
        accountId: account.id,
        categoryId: salary,
        type: "INCOME",
        amountCents: 620_000,
        frequency: "MONTHLY",
        interval: 1,
        nextRunDate: setDate(startOfMonth(subMonths(now, -1)), 25),
        label: "Salaire",
      },
    ],
  });

  // Budget on groceries.
  if (alimentation) {
    await db.budget.create({
      data: {
        userId: user.id,
        categoryId: alimentation,
        periodType: "MONTHLY",
        amountCents: 45_000,
        rollover: false,
      },
    });
  }

  // Savings goal.
  await db.savingsGoal.create({
    data: {
      userId: user.id,
      name: "Vacances",
      targetCents: 300_000,
      currentCents: 90_000,
      color: "#e6a4b4",
      accountId: savings.id,
    },
  });

  console.info(`✅ Seed terminé. Connexion démo : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
