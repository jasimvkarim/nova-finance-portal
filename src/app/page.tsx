export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Nova Finance
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your personal finance command center
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Log expenses manually, track debt, and get smart daily insights at 9 PM (Dubai).
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quick entry</h2>
            <p className="text-sm text-slate-500">
              Add a manual transaction. Nova will categorize and summarize it.
            </p>

            <form className="mt-6 grid gap-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <div className="flex gap-2">
                  <button type="button" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Expense</button>
                  <button type="button" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">Income</button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Amount (AED)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none">
                  <option>Food & Dining</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Rent & Bills</option>
                  <option>Debt Payment</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Groceries at Carrefour"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Save entry
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Daily snapshot</h3>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-600">Today’s spend</span>
                  <span className="font-semibold">AED 0.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-600">Debt paid</span>
                  <span className="font-semibold">AED 0.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-slate-600">Cash flow</span>
                  <span className="font-semibold">AED 0.00</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Smart suggestions</h3>
              <p className="mt-3 text-sm text-slate-600">
                Nova will send a WhatsApp summary every day at 9:00 PM (Dubai) with
                spend breakdowns, debt progress, and one action to improve cash flow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
