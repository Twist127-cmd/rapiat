import { differenceInCalendarMonths } from "date-fns";

import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import { toCents } from "@/lib/money";
import { tzDayStart } from "@/lib/dates";
import {
  monthlyContributionNeeded,
  progressPercent,
  remainingToTarget,
} from "@/modules/savings/domain/savings.rules";
import type { ContributionInput, SavingsGoalInput } from "@/modules/savings/schemas";
import type { SavingsGoalRow, SavingsSummary } from "@/modules/savings/types";

/** List goals with progress and (when a deadline is set) the monthly pace. */
export async function listSavingsGoals(
  scope: UserScope,
  now: Date = new Date(),
): Promise<SavingsGoalRow[]> {
  const rows = await scope.db.savingsGoal.findMany({
    include: { account: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => {
    const remaining = remainingToTarget(row.currentCents, row.targetCents);
    const monthsLeft = row.deadline ? differenceInCalendarMonths(row.deadline, now) : null;
    return {
      id: row.id,
      name: row.name,
      targetCents: row.targetCents,
      currentCents: row.currentCents,
      deadline: row.deadline,
      color: row.color,
      accountId: row.accountId,
      accountName: row.account?.name ?? null,
      percent: progressPercent(row.currentCents, row.targetCents),
      remainingCents: remaining,
      monthlyNeededCents:
        monthsLeft !== null ? monthlyContributionNeeded(remaining, monthsLeft) : null,
    };
  });
}

export async function getSavingsSummary(scope: UserScope): Promise<SavingsSummary> {
  const goals = await listSavingsGoals(scope);
  return {
    totalSavedCents: goals.reduce((s, g) => s + g.currentCents, 0),
    totalTargetCents: goals.reduce((s, g) => s + g.targetCents, 0),
    goalCount: goals.length,
  };
}

export async function createSavingsGoal(
  scope: UserScope,
  input: SavingsGoalInput,
): Promise<void> {
  await scope.db.savingsGoal.create({
    data: {
      userId: scope.userId,
      name: input.name,
      targetCents: toCents(input.target),
      currentCents: toCents(input.current),
      deadline: input.deadline ? tzDayStart(input.deadline, scope.timezone) : null,
      accountId: input.accountId || null,
      color: input.color,
    },
  });
}

export async function updateSavingsGoal(
  scope: UserScope,
  id: string,
  input: SavingsGoalInput,
): Promise<void> {
  const result = await scope.db.savingsGoal.updateMany({
    where: { id },
    data: {
      name: input.name,
      targetCents: toCents(input.target),
      currentCents: toCents(input.current),
      deadline: input.deadline ? tzDayStart(input.deadline, scope.timezone) : null,
      accountId: input.accountId || null,
      color: input.color,
    },
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Objectif introuvable.");
}

/** Add (or subtract) a manual contribution; never lets the balance go below 0. */
export async function contribute(
  { db }: UserScope,
  id: string,
  input: ContributionInput,
): Promise<void> {
  const goal = await db.savingsGoal.findUnique({ where: { id }, select: { currentCents: true } });
  if (!goal) throw new DomainError("NOT_FOUND", "Objectif introuvable.");
  const next = Math.max(0, goal.currentCents + toCents(input.amount));
  await db.savingsGoal.updateMany({ where: { id }, data: { currentCents: next } });
}

export async function deleteSavingsGoal({ db }: UserScope, id: string): Promise<void> {
  const result = await db.savingsGoal.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Objectif introuvable.");
}
