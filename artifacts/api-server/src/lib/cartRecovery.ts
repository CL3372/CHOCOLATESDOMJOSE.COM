import {
  listPendingOrders,
  updatePendingOrderData,
  deletePendingOrder,
  type StoredOrder,
  type Lang,
} from "./orderStore.js";
import { sendCartRecoveryEmail, type CartRecoveryStage } from "./notify.js";

// How long after an abandoned checkout each stage fires.
const REMINDER_HOURS = 3;
const PROOF_HOURS = 24;
const DEADLINE_HOURS = 72;

// After this many days with no payment, stop trying and just clean up the row
// (it's no longer useful for recovery, and the invoice-matching TTL in
// orderStore.getPendingOrder is a much shorter 24h anyway).
const PRUNE_AFTER_DAYS = 10;

// Confirmed with the business owner (Nov 2026) as the last order date to
// still arrive before Christmas. Update these each year.
const PT_CHRISTMAS_CUTOFF = new Date("2026-12-18T23:59:59Z");
const INTL_CHRISTMAS_CUTOFF = new Date("2026-12-12T23:59:59Z");

function isPortugal(country: string | undefined): boolean {
  const c = (country ?? "").trim().toLowerCase();
  return c === "" || c === "portugal" || c === "pt";
}

const MONTHS: Record<Lang, string[]> = {
  PT: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  EN: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  DE: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  NL: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
};

function formatDeadlineLabel(date: Date, lang: Lang): string {
  const day = date.getUTCDate();
  const month = MONTHS[lang][date.getUTCMonth()];
  if (lang === "DE") return `${day}. ${month}`;
  if (lang === "EN") return `${month} ${day}`;
  if (lang === "NL") return `${day} ${month}`;
  return `${day} de ${month}`; // PT
}

function deadlineLabelFor(country: string | undefined, lang: Lang): { date: Date; label: string } {
  const date = isPortugal(country) ? PT_CHRISTMAS_CUTOFF : INTL_CHRISTMAS_CUTOFF;
  return { date, label: formatDeadlineLabel(date, lang) };
}

export type CartRecoverySummary = {
  checked: number;
  sent: { reminder: number; proof: number; deadline: number };
  pruned: number;
};

/**
 * Runs once a day (triggered by Vercel Cron -> routes/cron.ts). Walks every
 * still-pending (unpaid) order and sends at most one recovery email per
 * order per run, based on how long it's been abandoned and what's already
 * been sent. Never touches orders that were paid — issueInvoiceReceipt's
 * success path already deletes a pending order via deletePendingOrder, so
 * anything still in the table here is, by definition, unpaid.
 */
export async function runCartRecovery(): Promise<CartRecoverySummary> {
  const summary: CartRecoverySummary = {
    checked: 0,
    sent: { reminder: 0, proof: 0, deadline: 0 },
    pruned: 0,
  };

  const orders = await listPendingOrders();

  for (const { orderKey, data, createdAt } of orders) {
    summary.checked++;
    const hoursElapsed = (Date.now() - createdAt.getTime()) / (60 * 60 * 1000);
    const daysElapsed = hoursElapsed / 24;

    if (daysElapsed > PRUNE_AFTER_DAYS) {
      await deletePendingOrder(orderKey);
      summary.pruned++;
      continue;
    }

    const sent = data.remindersSent ?? [];
    const recoveryOrder = {
      customerName: data.customer.name,
      customerEmail: data.customer.email,
      items: data.items,
      totalEur: data.totalEur,
      lang: data.lang,
    };

    let stage: CartRecoveryStage | undefined;
    let deadlineDateLabel: string | undefined;

    if (!sent.includes("reminder") && hoursElapsed >= REMINDER_HOURS) {
      stage = "reminder";
    } else if (sent.includes("reminder") && !sent.includes("proof") && hoursElapsed >= PROOF_HOURS) {
      stage = "proof";
    } else if (sent.includes("proof") && !sent.includes("deadline") && hoursElapsed >= DEADLINE_HOURS) {
      const { date, label } = deadlineLabelFor(data.shipping.country, data.lang);
      if (Date.now() <= date.getTime()) {
        stage = "deadline";
        deadlineDateLabel = label;
      } else {
        // Past the cutoff — nothing useful left to send. Mark it handled so
        // we stop re-checking this order every day until it's pruned.
        await updatePendingOrderData(orderKey, { ...data, remindersSent: [...sent, "deadline"] });
      }
    }

    if (!stage) continue;

    try {
      const ok = await sendCartRecoveryEmail(recoveryOrder, stage, deadlineDateLabel);
      if (ok) {
        await updatePendingOrderData(orderKey, { ...data, remindersSent: [...sent, stage] });
        summary.sent[stage]++;
      }
    } catch (e) {
      console.error(`Cart recovery (${stage}) failed for ${orderKey}:`, e);
    }
  }

  return summary;
}
