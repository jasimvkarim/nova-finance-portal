'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'nova-budget-plan-april-2026';
const SALARY = 10000;

type PaymentItem = {
  id: string;
  label: string;
  amount: number;
  step: number;
  note: string;
};

const SALARY_PAYMENTS: PaymentItem[] = [
  { id: 'sd_rent',      label: 'Rent',                 amount: 3450, step: 1, note: 'Pay first' },
  { id: 'sd_internet',  label: 'Internet + utilities',  amount: 1400, step: 1, note: 'Restore connection' },
  { id: 'sd_transport', label: 'Transport + gas',        amount: 600,  step: 1, note: '' },
  { id: 'sd_tabby',     label: 'Tabby — FULL CLEAR',     amount: 654,  step: 2, note: 'Eliminate' },
  { id: 'sd_cashnow',   label: 'Cash Now',               amount: 784,  step: 2, note: 'Immediate' },
  { id: 'sd_4882_min',  label: 'Card 4882 minimum',      amount: 100,  step: 3, note: 'Due 17th' },
  { id: 'sd_6501_min',  label: 'Card 6501 minimum',      amount: 100,  step: 3, note: 'Due 30th' },
  { id: 'sd_4782',      label: 'Card 4782 extra',         amount: 400,  step: 4, note: 'Overdue — stop damage' },
  { id: 'sd_6501_att',  label: 'Card 6501 attack',        amount: 1000, step: 5, note: 'Debt reduction' },
  { id: 'sd_living',    label: 'Living money set aside',  amount: 1450, step: 6, note: 'Weekly: 350–375' },
];

const STEPS = [
  { step: 1, label: 'Essentials',      dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    border: 'border-red-200' },
  { step: 2, label: 'Clear Critical',  dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { step: 3, label: 'Stop Penalties',  dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { step: 4, label: 'Handle Overdue',  dot: 'bg-rose-600',   badge: 'bg-rose-100 text-rose-700',   border: 'border-rose-200' },
  { step: 5, label: 'Attack 6501',     dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  { step: 6, label: 'Living Money',    dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700', border: 'border-green-200' },
];

type ChecklistSection = {
  id: string;
  label: string;
  items: { id: string; label: string; note?: string; optional?: boolean }[];
};

const BEFORE_SALARY: ChecklistSection = {
  id: 'before',
  label: 'Before Salary (Now → 14th)',
  items: [
    { id: 'bs_4782',  label: 'Pay card 4782 → AED 50–100',           note: 'Overdue — do this NOW' },
    { id: 'bs_spend', label: 'Essentials only (food + transport)',    note: 'Ultra strict' },
    { id: 'bs_nocredit', label: 'Zero credit card / Tabby usage' },
    { id: 'bs_cashnow',  label: 'Cash Now: delay to 15th if needed', note: 'Max 2-day delay safe' },
  ],
};

const WEEKLY_SECTIONS: ChecklistSection[] = [
  {
    id: 'week1',
    label: 'Week 1 (15–21)',
    items: [
      { id: 'w1_4882',  label: 'Confirm card 4882 minimum paid' },
      { id: 'w1_spend', label: 'Spend ≤ AED 375 this week' },
    ],
  },
  {
    id: 'week2',
    label: 'Week 2 (22–28)',
    items: [
      { id: 'w2_spend', label: 'Spend ≤ AED 375 this week' },
      { id: 'w2_6501',  label: 'Extra AED 200–300 to card 6501', optional: true },
    ],
  },
  {
    id: 'week3',
    label: 'Week 3 (29–5)',
    items: [
      { id: 'w3_spend', label: 'Spend ≤ AED 375 this week' },
      { id: 'w3_6501',  label: 'Continue 6501 push if possible',  optional: true },
    ],
  },
  {
    id: 'week4',
    label: 'Week 4 (6–14)',
    items: [
      { id: 'w4_spend',  label: 'Spend ≤ AED 375 this week' },
      { id: 'w4_prep',   label: 'No overspending — prepare next cycle' },
    ],
  },
];

const END_GOALS = [
  { id: 'eg_internet', label: 'Internet working and stable' },
  { id: 'eg_tabby',    label: 'Tabby fully cleared (zero balance)' },
  { id: 'eg_cashnow',  label: 'Cash Now paid' },
  { id: 'eg_nofees',   label: 'No late fees this month' },
  { id: 'eg_6501',     label: 'Card 6501 reduced by AED 1,000+' },
];

const RULES = [
  'Internet always paid first — protects income',
  'No missed due dates — even small payments matter',
  'No new debt — no Tabby / BNPL / credit usage',
  'Weekly limit AED 350–375 is law',
];

// ─── Calendar export ────────────────────────────────────────────────────────

function icsDate(isoDate: string, timeUtc?: string): string {
  // isoDate: 'YYYY-MM-DD', timeUtc: 'HHmmss' → datetime, else all-day
  const d = isoDate.replace(/-/g, '');
  return timeUtc ? `${d}T${timeUtc}Z` : `${d}`;
}

function makeEvent({
  uid, summary, description, date, timeUtc, alarmMinutes = 0,
}: {
  uid: string; summary: string; description: string;
  date: string; timeUtc?: string; alarmMinutes?: number;
}): string {
  const dtStart = timeUtc
    ? `DTSTART:${icsDate(date, timeUtc)}`
    : `DTSTART;VALUE=DATE:${icsDate(date)}`;
  const dtEnd = timeUtc
    ? `DTEND:${icsDate(date, timeUtc)}`
    : `DTEND;VALUE=DATE:${icsDate(date)}`;
  const alarm = alarmMinutes >= 0
    ? `BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${summary}\r\nTRIGGER:-PT${alarmMinutes}M\r\nEND:VALARM\r\n`
    : '';
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsDate('2026-03-28', '000000')}`,
    dtStart,
    dtEnd,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    alarm + 'END:VEVENT',
  ].join('\r\n');
}

function downloadICS() {
  // Dubai = UTC+4, so 8 AM Dubai = 04:00 UTC, 9 AM = 05:00 UTC
  const events = [
    makeEvent({
      uid: 'nova-bs-4782@nova-finance',
      summary: 'PAY Card 4782 — AED 50-100 (OVERDUE)',
      description: 'Card 4782 is overdue. Pay AED 50-100 ASAP — before salary on 15th.',
      date: '2026-03-28',
      alarmMinutes: 0,
    }),
    makeEvent({
      uid: 'nova-cashnow-delay@nova-finance',
      summary: 'Cash Now — last safe day to delay (pay on 15th)',
      description: 'If Cash Now is unpaid, delay max 2 days. Pay immediately on salary day (15th).',
      date: '2026-04-13',
      timeUtc: '050000',
      alarmMinutes: 0,
    }),
    makeEvent({
      uid: 'nova-salary-day@nova-finance',
      summary: 'SALARY DAY — Execute Budget Plan',
      description: 'Order: Rent → Internet → Transport → Tabby → Cash Now → 4882 min → 6501 min → 4782 extra → 6501 attack → Keep 1,400-1,500',
      date: '2026-04-15',
      timeUtc: '040000',
      alarmMinutes: 0,
    }),
    makeEvent({
      uid: 'nova-4882-due@nova-finance',
      summary: 'Card 4882 minimum due (AED 100)',
      description: 'Card 4882 minimum payment due. Should already be paid on salary day (15th).',
      date: '2026-04-17',
      timeUtc: '050000',
      alarmMinutes: 60,
    }),
    makeEvent({
      uid: 'nova-week2-check@nova-finance',
      summary: 'Nova — Week 2 budget check',
      description: 'Spend ≤ AED 375 this week. Optional: extra AED 200-300 to card 6501.',
      date: '2026-04-22',
      timeUtc: '050000',
      alarmMinutes: 0,
    }),
    makeEvent({
      uid: 'nova-week3-check@nova-finance',
      summary: 'Nova — Week 3 budget check',
      description: 'Spend ≤ AED 375 this week. Continue 6501 push if possible.',
      date: '2026-04-29',
      timeUtc: '050000',
      alarmMinutes: 0,
    }),
    makeEvent({
      uid: 'nova-6501-due@nova-finance',
      summary: 'Card 6501 minimum due (AED 100)',
      description: 'Card 6501 minimum payment due today.',
      date: '2026-04-30',
      timeUtc: '050000',
      alarmMinutes: 120,
    }),
    makeEvent({
      uid: 'nova-week4-check@nova-finance',
      summary: 'Nova — Week 4: prepare next cycle',
      description: 'Spend ≤ AED 375. No overspending. Prepare for next salary cycle.',
      date: '2026-05-06',
      timeUtc: '050000',
      alarmMinutes: 0,
    }),
  ];

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nova Finance//Budget Plan April 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Nova Budget Plan — April 2026',
    'X-WR-TIMEZONE:Asia/Dubai',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([cal], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nova-budget-april-2026.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Notifications ───────────────────────────────────────────────────────────

const NOTIF_STORAGE_KEY = 'nova-notif-last-shown';
const NOTIF_ENABLED_KEY = 'nova-notif-enabled';

function getTodayMessage(): { title: string; body: string } {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-based
  const day = today.getDate();

  if (month === 3 || (month === 4 && day < 15)) {
    return {
      title: 'Before salary reminder',
      body: 'Card 4782 paid? Spending essentials only? Stay on track.',
    };
  }
  if (month === 4 && day === 15) {
    return {
      title: 'SALARY DAY — Open Nova Finance',
      body: 'Execute the plan: Rent → Internet → Tabby → Cash Now → Cards → 6501 attack',
    };
  }
  if (month === 4 && day <= 21) {
    return {
      title: 'Week 1 check-in',
      body: 'Spend ≤ AED 375 this week. Card 4882 confirmed paid?',
    };
  }
  return {
    title: 'Weekly budget check',
    body: 'Spend ≤ AED 375 this week. Stay within the plan.',
  };
}

function CheckItem({
  id,
  label,
  note,
  optional,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  note?: string;
  optional?: boolean;
  checked: boolean;
  onChange: (id: string, val: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        checked
          ? 'border-green-200 bg-green-50'
          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(id, e.target.checked)}
          className="sr-only"
        />
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
            checked ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'
          }`}
        >
          {checked && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium leading-snug ${checked ? 'text-green-700 line-through decoration-green-400' : 'text-slate-800'}`}>
          {label}
        </span>
        {note && (
          <p className={`mt-0.5 text-xs ${checked ? 'text-green-500' : 'text-slate-500'}`}>{note}</p>
        )}
        {optional && !note && (
          <p className={`mt-0.5 text-xs ${checked ? 'text-green-500' : 'text-slate-400'}`}>Optional</p>
        )}
      </div>
    </label>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500 tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}

export default function BudgetPlanPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecks(JSON.parse(saved));
    } catch {}

    // Determine notification status
    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
    } else if (Notification.permission === 'granted') {
      setNotifStatus('granted');
      // Fire a daily reminder if enabled and not shown today
      const enabled = localStorage.getItem(NOTIF_ENABLED_KEY) === 'true';
      if (enabled) {
        const lastShown = localStorage.getItem(NOTIF_STORAGE_KEY);
        const today = new Date().toDateString();
        if (lastShown !== today) {
          try {
            const { title, body } = getTodayMessage();
            new Notification(title, { body, icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon.ico` });
            localStorage.setItem(NOTIF_STORAGE_KEY, today);
          } catch {}
        }
      }
    } else if (Notification.permission === 'denied') {
      setNotifStatus('denied');
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    } catch {}
  }, [checks, hydrated]);

  function toggle(id: string, val: boolean) {
    setChecks((prev) => ({ ...prev, [id]: val }));
  }

  async function enableNotifications() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      setNotifStatus('granted');
      try {
        new Notification('Nova Finance reminders on', {
          body: 'You will get a daily check-in when you open the app.',
          icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon.ico`,
        });
      } catch {}
    } else {
      setNotifStatus('denied');
    }
  }

  function resetAll() {
    if (confirm('Reset all checkboxes? This cannot be undone.')) {
      setChecks({});
    }
  }

  // Live remaining balance on salary day
  const spent = SALARY_PAYMENTS.reduce(
    (acc, p) => (checks[p.id] ? acc + p.amount : acc),
    0,
  );
  const remaining = SALARY - spent;

  // Overall progress
  const allIds = [
    ...BEFORE_SALARY.items.map((i) => i.id),
    ...SALARY_PAYMENTS.map((p) => p.id),
    ...WEEKLY_SECTIONS.flatMap((s) => s.items.map((i) => i.id)),
    ...END_GOALS.map((g) => g.id),
  ];
  const totalDone = allIds.filter((id) => checks[id]).length;
  const totalAll = allIds.length;

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 pb-20">

        {/* Header */}
        <div>
          <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12">
              <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Nova Finance
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Monthly Budget Plan</h1>
          <p className="mt-1 text-slate-500">April 2026 · Salary on 15th · 10,000 AED</p>
          <div className="mt-4">
            <ProgressBar done={totalDone} total={totalAll} />
            <p className="mt-1 text-xs text-slate-400">{totalDone} of {totalAll} tasks complete</p>
          </div>
        </div>

        {/* Reminders */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Stay on track</h2>
          <div className="grid gap-3 sm:grid-cols-2">

            {/* Export to Calendar */}
            <button
              onClick={downloadICS}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Export to Calendar</p>
                <p className="text-xs text-slate-500">All dates + alarms → .ics</p>
              </div>
            </button>

            {/* Browser notifications */}
            {notifStatus === 'granted' ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 016 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M8 17a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Daily reminders on</p>
                  <p className="text-xs text-green-600">Shown when you open the app</p>
                </div>
              </div>
            ) : notifStatus === 'denied' ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 016 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M8 17a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Notifications blocked</p>
                  <p className="text-xs text-slate-400">Enable in browser settings</p>
                </div>
              </div>
            ) : notifStatus === 'unsupported' ? null : (
              <button
                onClick={enableNotifications}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 016 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M8 17a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Enable daily reminders</p>
                  <p className="text-xs text-slate-500">Check-in when you open the app</p>
                </div>
              </button>
            )}

          </div>

          {/* Add to home screen hint */}
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Add to home screen</span> for one-tap access on your phone — tap Share (iOS) or menu (Android) → "Add to Home Screen"
          </p>
        </section>

        {/* Overview */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">This month must achieve</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: 'Internet', goal: 'Restored + never cut again', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { label: 'Tabby', goal: 'Cleared fully', color: 'bg-orange-50 border-orange-200 text-orange-800' },
              { label: 'Cash Now', goal: 'Paid on time', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
              { label: 'Card 4782', goal: 'Stabilized (overdue now)', color: 'bg-red-50 border-red-200 text-red-800' },
              { label: 'Card 6501', goal: 'Reduced heavily', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
              { label: 'Card 4882', goal: 'Safe — no penalties', color: 'bg-green-50 border-green-200 text-green-800' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.color}`}>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs opacity-80">{item.goal}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 1 — Before Salary */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Phase 1</span>
              <h2 className="mt-1 text-lg font-semibold">{BEFORE_SALARY.label}</h2>
            </div>
            <ProgressBar
              done={BEFORE_SALARY.items.filter((i) => checks[i.id]).length}
              total={BEFORE_SALARY.items.length}
            />
          </div>
          <div className="grid gap-2">
            {BEFORE_SALARY.items.map((item) => (
              <CheckItem
                key={item.id}
                {...item}
                checked={!!checks[item.id]}
                onChange={toggle}
              />
            ))}
          </div>
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            Ignore everything else until salary. Goal: survive and contain damage.
          </p>
        </section>

        {/* Phase 2 — Salary Day */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="inline-block rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-white">Phase 2</span>
              <h2 className="mt-1 text-lg font-semibold">Salary Day — 15th</h2>
            </div>
          </div>

          {/* Remaining balance */}
          <div className={`mb-4 rounded-2xl border p-4 text-center transition-colors ${remaining < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Remaining after checked payments</p>
            <p className={`mt-1 text-4xl font-bold tabular-nums tracking-tight ${remaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
              AED {remaining.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">of AED {SALARY.toLocaleString()} salary · AED {spent.toLocaleString()} allocated</p>
          </div>

          {/* Steps */}
          <div className="grid gap-4">
            {STEPS.map(({ step, label, dot, badge, border }) => {
              const stepItems = SALARY_PAYMENTS.filter((p) => p.step === step);
              const stepDone = stepItems.filter((p) => checks[p.id]).length;
              return (
                <div key={step} className={`rounded-2xl border ${border} bg-white p-4`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
                        Step {step}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 tabular-nums">{stepDone}/{stepItems.length}</span>
                  </div>
                  <div className="grid gap-2">
                    {stepItems.map((item) => (
                      <CheckItem
                        key={item.id}
                        id={item.id}
                        label={`${item.label} — AED ${item.amount.toLocaleString()}`}
                        note={item.note}
                        checked={!!checks[item.id]}
                        onChange={toggle}
                      />
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Step total</span>
                      <span className="tabular-nums font-medium">AED {stepItems.reduce((a, p) => a + p.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Phase 3 — Weekly */}
        <section>
          <div className="mb-3">
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Phase 3</span>
            <h2 className="mt-1 text-lg font-semibold">Week by Week</h2>
          </div>
          <div className="grid gap-4">
            {WEEKLY_SECTIONS.map((section, idx) => {
              const done = section.items.filter((i) => checks[i.id]).length;
              return (
                <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Week {idx + 1}</span>
                      <span className="text-sm text-slate-400">{section.label.replace(`Week ${idx + 1} `, '')}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{done}/{section.items.length}</span>
                  </div>
                  <div className="grid gap-2">
                    {section.items.map((item) => (
                      <CheckItem
                        key={item.id}
                        {...item}
                        checked={!!checks[item.id]}
                        onChange={toggle}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Non-negotiable Rules */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Non-negotiable rules</h2>
          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4">
            <div className="grid gap-2">
              {RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{i + 1}</span>
                  <p className="text-sm text-slate-200">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* End of Month Goals */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">End of month goals</h2>
          <div className="grid gap-2">
            {END_GOALS.map((goal) => (
              <CheckItem
                key={goal.id}
                id={goal.id}
                label={goal.label}
                checked={!!checks[goal.id]}
                onChange={toggle}
              />
            ))}
          </div>
          {END_GOALS.every((g) => checks[g.id]) && (
            <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-4 text-center">
              <p className="text-lg font-semibold text-green-700">This was the last chaotic month.</p>
              <p className="text-sm text-green-600">Pressure drops. Control increases. Progress becomes visible.</p>
            </div>
          )}
        </section>

        {/* Lockscreen Script */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Salary day script</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs text-slate-500">On the 15th, just follow this order:</p>
            <div className="grid gap-2 text-sm font-medium">
              {[
                '1. Essentials (rent, internet, transport)',
                '2. Tabby — full clear',
                '3. Cash Now — immediate',
                '4. Card minimums (4882, 6501)',
                '5. Card 4782 extra payment',
                '6. Card 6501 attack — AED 1,000',
                '7. Live within AED 375/week',
              ].map((line) => (
                <p key={line} className="text-slate-700">{line}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Reset */}
        <div className="flex justify-center pt-2">
          <button
            onClick={resetAll}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600"
          >
            Reset all checkboxes
          </button>
        </div>
      </div>
    </div>
  );
}
