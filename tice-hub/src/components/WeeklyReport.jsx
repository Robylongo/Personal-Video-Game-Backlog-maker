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

function hasThreeWeekGrowth(trend) {
  if (!Array.isArray(trend) || trend.length < 4) return false

  let consecutiveGrowth = 0
  for (let i = 1; i < trend.length; i += 1) {
    if (trend[i] > trend[i - 1]) {
      consecutiveGrowth += 1
      if (consecutiveGrowth >= 3) return true
    } else {
      consecutiveGrowth = 0
    }
  }

  return false
}

function buildWinReason(store) {
  if (store.salesVsTarget >= 105) {
    return `beating target by ${(store.salesVsTarget - 100).toFixed(1)}% with weekly sales of ${currency.format(store.weeklySales)}.`
  }

  if (store.laborCostPercent < store.laborTarget && store.foodCostPercent < store.foodCostTarget) {
    return `holding both costs below target (labor ${formatPercent(store.laborCostPercent)}, food ${formatPercent(store.foodCostPercent)}).`
  }

  if (store.customerSatisfaction >= 4.5) {
    return `delivering excellent customer satisfaction at ${store.customerSatisfaction.toFixed(1)}.`
  }

  return `posting 3+ consecutive weeks of sales growth (${store.salesTrend.join(' → ')}).`
}

function buildProblemReason(store) {
  const issues = []

  if (store.salesVsTarget < 92) {
    issues.push(`sales at ${formatPercent(store.salesVsTarget)} vs target`)
  }
  if (store.laborCostPercent > store.laborTarget + 3) {
    issues.push(`labor at ${formatPercent(store.laborCostPercent)} (target ${formatPercent(store.laborTarget)})`)
  }
  if (store.foodCostPercent > store.foodCostTarget + 3) {
    issues.push(`food cost at ${formatPercent(store.foodCostPercent)} (target ${formatPercent(store.foodCostTarget)})`)
  }
  if (store.customerSatisfaction < 3.5) {
    issues.push(`satisfaction at ${store.customerSatisfaction.toFixed(1)}`)
  }
  if (store.employeeTurnover > 25) {
    issues.push(`turnover at ${formatPercent(store.employeeTurnover)}`)
  }
  if (store.driveThruTime > 300) {
    issues.push(`drive-thru at ${store.driveThruTime}s`)
  }

  return `${issues.slice(0, 2).join('; ')}.`
}

function getCriticalScore(store) {
  let score = 0
  if (store.salesVsTarget < 92) score += 3
  if (store.laborCostPercent > store.laborTarget + 3) score += 3
  if (store.foodCostPercent > store.foodCostTarget + 3) score += 3
  if (store.customerSatisfaction < 3.5) score += 2
  if (store.employeeTurnover > 25) score += 2
  if (store.driveThruTime > 300) score += 2
  return score
}

function WeeklyReport() {
  const [copyState, setCopyState] = useState('idle')

  const report = useMemo(() => {
    const totalSales = storeData.reduce((sum, store) => sum + store.weeklySales, 0)
    const totalTarget = storeData.reduce((sum, store) => sum + store.weeklyTarget, 0)
    const storesAboveTarget = storeData.filter((store) => store.salesVsTarget >= 100)
    const storesBelowTarget = storeData.filter((store) => store.salesVsTarget < 100)

    const goingWell = storeData
      .filter((store) => {
        const salesWin = store.salesVsTarget >= 105
        const costWin = store.laborCostPercent < store.laborTarget && store.foodCostPercent < store.foodCostTarget
        const satisfactionWin = store.customerSatisfaction >= 4.5
        const trendWin = hasThreeWeekGrowth(store.salesTrend)
        return salesWin || costWin || satisfactionWin || trendWin
      })
      .map((store) => ({
        ...store,
        winReason: buildWinReason(store),
      }))
      .sort((a, b) => b.salesVsTarget - a.salesVsTarget)
      .slice(0, 10)

    const needsAttention = storeData
      .filter(
        (store) =>
          store.salesVsTarget < 92 ||
          store.laborCostPercent > store.laborTarget + 3 ||
          store.foodCostPercent > store.foodCostTarget + 3 ||
          store.customerSatisfaction < 3.5 ||
          store.employeeTurnover > 25 ||
          store.driveThruTime > 300,
      )
      .map((store) => ({
        ...store,
        problemReason: buildProblemReason(store),
      }))
      .sort((a, b) => getCriticalScore(b) - getCriticalScore(a) || a.salesVsTarget - b.salesVsTarget)

    const portfolioAverageTurnover =
      storeData.reduce((sum, store) => sum + store.employeeTurnover, 0) / storeData.length

    const recommendedActions = needsAttention.map((store) => {
      const actionCandidates = []

      if (store.laborCostPercent > store.laborTarget + 3) {
        actionCandidates.push({
          severity: (store.laborCostPercent - (store.laborTarget + 3)) * 100,
          action: `Review ${store.name} scheduling against hourly sales data. Identify overstaffed dayparts and reduce overlap shifts. Target: bring labor from ${store.laborCostPercent.toFixed(1)}% to ${store.laborTarget.toFixed(1)}% within 2 weeks.`,
        })
      }

      if (store.foodCostPercent > store.foodCostTarget + 3) {
        actionCandidates.push({
          severity: (store.foodCostPercent - (store.foodCostTarget + 3)) * 100,
          action: `Conduct waste audit at ${store.name} this week. Review prep quantities vs actual sales and check for portioning drift. Current food cost ${store.foodCostPercent.toFixed(1)}% vs ${store.foodCostTarget.toFixed(1)}% target.`,
        })
      }

      if (store.employeeTurnover > 25) {
        const turnoverRatio = (store.employeeTurnover / portfolioAverageTurnover).toFixed(1)
        actionCandidates.push({
          severity: (store.employeeTurnover - 25) * 10,
          action: `Schedule exit interview review at ${store.name} with district manager. Current ${store.employeeTurnover.toFixed(1)}% monthly turnover is ${turnoverRatio}x portfolio average. Evaluate shift lead effectiveness and crew scheduling fairness.`,
        })
      }

      if (store.customerSatisfaction < 3.5) {
        actionCandidates.push({
          severity: (3.5 - store.customerSatisfaction) * 100,
          action: `Deploy mystery shop at ${store.name} within 5 business days. Current ${store.customerSatisfaction.toFixed(1)} satisfaction is lowest in portfolio. Review speed-of-service and order accuracy logs.`,
        })
      }

      if (store.salesVsTarget < 92) {
        actionCandidates.push({
          severity: (92 - store.salesVsTarget) * 10,
          action: `Analyze ${store.name} traffic patterns vs prior year. Review local marketing activation and promotional compliance. Evaluate whether competitive openings have impacted trade area.`,
        })
      }

      if (store.driveThruTime > 300) {
        actionCandidates.push({
          severity: store.driveThruTime - 300,
          action: `Evaluate drive-thru bottleneck at ${store.name}. Check equipment functionality, menu board clarity, and peak-hour positioning. Current avg ${store.driveThruTime} seconds vs 180-second target.`,
        })
      }

      const actions = actionCandidates
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 2)
        .map((item) => item.action)

      return {
        id: store.id,
        name: store.name,
        cityState: `${store.city}, ${store.state}`,
        actions,
      }
    })

    const bestPerformingStore = [...storeData].sort(
      (a, b) => b.salesVsTarget - a.salesVsTarget || b.customerSatisfaction - a.customerSatisfaction,
    )[0]

    const mostCriticalStore = [...storeData].sort(
      (a, b) => getCriticalScore(b) - getCriticalScore(a) || a.salesVsTarget - b.salesVsTarget,
    )[0]

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
      bestPerformingStore,
      mostCriticalStore,
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
    lines.push(
      `- Best performing store: ${report.bestPerformingStore.name} — ${formatPercent(report.bestPerformingStore.salesVsTarget)} vs target with satisfaction ${report.bestPerformingStore.customerSatisfaction.toFixed(1)}`,
    )
    lines.push(
      `- Most critical store: ${report.mostCriticalStore.name} — ${formatPercent(report.mostCriticalStore.salesVsTarget)} vs target, labor ${formatPercent(report.mostCriticalStore.laborCostPercent)}, drive-thru ${report.mostCriticalStore.driveThruTime}s`,
    )
    lines.push('')
    lines.push("What's Going Well")
    report.goingWell.forEach((store) => {
      lines.push(`- ${store.name} (${store.city}) — ${store.winReason}`)
    })
    lines.push('')
    lines.push('Needs Attention')
    report.needsAttention.forEach((store) => {
      lines.push(`- ${store.name} (${store.city}) — ${store.problemReason}`)
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
            <li>
              Best performing store: {report.bestPerformingStore.name} — {formatPercent(report.bestPerformingStore.salesVsTarget)}
              {' '}vs target with satisfaction {report.bestPerformingStore.customerSatisfaction.toFixed(1)}
            </li>
            <li>
              Most critical store: {report.mostCriticalStore.name} — {formatPercent(report.mostCriticalStore.salesVsTarget)}
              {' '}vs target, labor {formatPercent(report.mostCriticalStore.laborCostPercent)}, drive-thru {report.mostCriticalStore.driveThruTime}s
            </li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">What&apos;s Going Well</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.goingWell.map((store) => (
              <li key={store.id}>
                {store.name} ({store.city}) — {store.winReason}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {report.needsAttention.map((store) => (
              <li key={store.id}>
                {store.name} ({store.city}) — {store.problemReason}
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
