import { useMemo, useState } from 'react'
import storeData from '../data/storeData'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

function WeeklyReport() {
  const [copyState, setCopyState] = useState('idle')

  const report = useMemo(() => {
    const totalSales = storeData.reduce((sum, store) => sum + store.weeklySales, 0)
    const totalTarget = storeData.reduce((sum, store) => sum + store.weeklyTarget, 0)
    const storesAboveTarget = storeData.filter((store) => store.salesVsTarget >= 100)
    const storesBelowTarget = storeData.filter((store) => store.salesVsTarget < 100)

    const goingWell = storeData.filter(
      (store) =>
        store.salesVsTarget > 105 &&
        store.laborCostPercent <= store.laborTarget &&
        store.foodCostPercent <= store.foodCostTarget &&
        store.customerSatisfaction > 4.3,
    )

    const needsAttention = storeData.filter(
      (store) =>
        store.salesVsTarget < 97 ||
        store.laborCostPercent > store.laborTarget + 2 ||
        store.foodCostPercent > store.foodCostTarget + 2 ||
        store.customerSatisfaction < 3.5 ||
        store.driveThruTime > 240 ||
        store.employeeTurnover > 12,
    )

    const recommendedActions = needsAttention.map((store) => {
      const actions = []

      if (store.salesVsTarget < 97) actions.push('run local sales recovery offer and manager-led peak checks')
      if (store.laborCostPercent > store.laborTarget + 2) actions.push('rebuild labor schedule to match hour-by-hour demand')
      if (store.foodCostPercent > store.foodCostTarget + 2) actions.push('tighten waste controls and shift-level inventory counts')
      if (store.customerSatisfaction < 3.5) actions.push('launch service recovery coaching and complaint follow-ups')
      if (store.driveThruTime > 240) actions.push('add drive-thru expeditor at peak and simplify order handoff')
      if (store.employeeTurnover > 12) actions.push('execute retention check-ins and 30-day crew coaching plans')

      return {
        id: store.id,
        name: store.name,
        cityState: `${store.city}, ${store.state}`,
        actions,
      }
    })

    const regionalBreakdown = Object.values(
      storeData.reduce((acc, store) => {
        if (!acc[store.region]) {
          acc[store.region] = {
            region: store.region,
            stores: 0,
            sales: 0,
            target: 0,
            avgLabor: 0,
            avgFood: 0,
            avgSatisfaction: 0,
          }
        }

        acc[store.region].stores += 1
        acc[store.region].sales += store.weeklySales
        acc[store.region].target += store.weeklyTarget
        acc[store.region].avgLabor += store.laborCostPercent
        acc[store.region].avgFood += store.foodCostPercent
        acc[store.region].avgSatisfaction += store.customerSatisfaction

        return acc
      }, {}),
    )
      .map((region) => ({
        ...region,
        salesVsTarget: (region.sales / region.target) * 100,
        avgLabor: region.avgLabor / region.stores,
        avgFood: region.avgFood / region.stores,
        avgSatisfaction: region.avgSatisfaction / region.stores,
      }))
      .sort((a, b) => a.salesVsTarget - b.salesVsTarget)

    return {
      totalSales,
      totalTarget,
      portfolioSalesVsTarget: (totalSales / totalTarget) * 100,
      storesAboveTarget,
      storesBelowTarget,
      goingWell,
      needsAttention,
      recommendedActions,
      regionalBreakdown,
    }
  }, [])

  const reportText = useMemo(() => {
    const lines = []

    lines.push('TICE Weekly Executive Summary')
    lines.push('')
    lines.push('Portfolio Summary')
    lines.push(`- Total Sales: ${currency.format(report.totalSales)} (${formatPercent(report.portfolioSalesVsTarget)} of target ${currency.format(report.totalTarget)})`)
    lines.push(`- Stores Above Target: ${report.storesAboveTarget.length}`)
    lines.push(`- Stores Below Target: ${report.storesBelowTarget.length}`)
    lines.push('')
    lines.push("What's Going Well")
    report.goingWell.forEach((store) => {
      lines.push(`- ${store.id} ${store.name}: ${formatPercent(store.salesVsTarget)} sales vs target, costs in-control, satisfaction ${store.customerSatisfaction.toFixed(1)}`)
    })
    lines.push('')
    lines.push('Needs Attention')
    report.needsAttention.forEach((store) => {
      lines.push(
        `- ${store.id} ${store.name}: sales ${formatPercent(store.salesVsTarget)}, labor ${formatPercent(
          store.laborCostPercent,
        )}, food ${formatPercent(store.foodCostPercent)}, satisfaction ${store.customerSatisfaction.toFixed(
          1,
        )}, drive-thru ${store.driveThruTime}s, turnover ${formatPercent(store.employeeTurnover)}`,
      )
    })

    return lines.join('\n')
  }, [report])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 2500)
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Weekly Executive Report</h2>
          <p className="mt-1 text-sm text-slate-300">Auto-generated from live store KPIs (no API calls).</p>
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy to Clipboard'}
        </button>
      </div>

      <div className="space-y-5 text-sm text-slate-200">
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">Portfolio Summary</h3>
          <ul className="mt-2 space-y-1">
            <li>Total sales: {currency.format(report.totalSales)}</li>
            <li>
              Sales vs target: {formatPercent(report.portfolioSalesVsTarget)} of {currency.format(report.totalTarget)}
            </li>
            <li>Stores above target: {report.storesAboveTarget.length}</li>
            <li>Stores below target: {report.storesBelowTarget.length}</li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">What&apos;s Going Well</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.goingWell.map((store) => (
              <li key={store.id}>
                <span className="font-semibold text-white">{store.id}</span> {store.name} — {formatPercent(store.salesVsTarget)}
                {' '}sales vs target, labor {formatPercent(store.laborCostPercent)}, food {formatPercent(store.foodCostPercent)}, satisfaction{' '}
                {store.customerSatisfaction.toFixed(1)}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.needsAttention.map((store) => (
              <li key={store.id}>
                <span className="font-semibold text-white">{store.id}</span> {store.name} — {formatPercent(store.salesVsTarget)}
                {' '}sales vs target, labor {formatPercent(store.laborCostPercent)}, food {formatPercent(store.foodCostPercent)}, satisfaction{' '}
                {store.customerSatisfaction.toFixed(1)}, drive-thru {store.driveThruTime}s, turnover {formatPercent(store.employeeTurnover)}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">Recommended Actions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.recommendedActions.map((item) => (
              <li key={item.id}>
                <span className="font-semibold text-white">{item.id} {item.name}</span> ({item.cityState}) — {item.actions.join('; ')}.
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">Regional Breakdown</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Stores</th>
                  <th className="px-3 py-2">Sales</th>
                  <th className="px-3 py-2">Sales vs Target</th>
                  <th className="px-3 py-2">Avg Labor %</th>
                  <th className="px-3 py-2">Avg Food %</th>
                  <th className="px-3 py-2">Avg Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {report.regionalBreakdown.map((region) => (
                  <tr key={region.region} className="border-t border-slate-800 text-slate-200">
                    <td className="px-3 py-2">{region.region}</td>
                    <td className="px-3 py-2">{region.stores}</td>
                    <td className="px-3 py-2">{currency.format(region.sales)}</td>
                    <td className="px-3 py-2">{formatPercent(region.salesVsTarget)}</td>
                    <td className="px-3 py-2">{formatPercent(region.avgLabor)}</td>
                    <td className="px-3 py-2">{formatPercent(region.avgFood)}</td>
                    <td className="px-3 py-2">{region.avgSatisfaction.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}

export default WeeklyReport
