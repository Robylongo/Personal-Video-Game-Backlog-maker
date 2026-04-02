import { useMemo, useState } from 'react'
import storeData from '../data/storeData'

const SALES_THRESHOLDS = { green: 105, yellow: 95 }
const COST_BUFFER = 2

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function metricPillClass(status) {
  if (status === 'good') return 'bg-emerald-500/15 text-emerald-300'
  if (status === 'warn') return 'bg-amber-500/15 text-amber-300'
  return 'bg-rose-500/15 text-rose-300'
}

function getSalesStatus(value) {
  if (value >= SALES_THRESHOLDS.green) return 'good'
  if (value >= SALES_THRESHOLDS.yellow) return 'warn'
  return 'bad'
}

function getCostStatus(value, target) {
  if (value <= target) return 'good'
  if (value <= target + COST_BUFFER) return 'warn'
  return 'bad'
}

function getSatisfactionStatus(value) {
  if (value >= 4.5) return 'good'
  if (value >= 4) return 'warn'
  return 'bad'
}

const columnConfig = {
  name: { label: 'Store Name' },
  location: { label: 'City / State' },
  weeklySales: { label: 'Weekly Sales' },
  salesVsTarget: { label: 'Sales vs Target %' },
  laborCostPercent: { label: 'Labor %' },
  foodCostPercent: { label: 'Food Cost %' },
  customerSatisfaction: { label: 'Customer Satisfaction' },
}

function Dashboard() {
  const [activeRegion, setActiveRegion] = useState('All Regions')
  const [sortConfig, setSortConfig] = useState({ key: 'salesVsTarget', direction: 'asc' })

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(storeData.map((store) => store.region))].sort()
    return ['All Regions', ...uniqueRegions]
  }, [])

  const filteredStores = useMemo(() => {
    if (activeRegion === 'All Regions') return storeData
    return storeData.filter((store) => store.region === activeRegion)
  }, [activeRegion])

  const sortedStores = useMemo(() => {
    const sorted = [...filteredStores]

    sorted.sort((a, b) => {
      const { key, direction } = sortConfig
      const sortDirection = direction === 'asc' ? 1 : -1

      const aValue = key === 'location' ? `${a.city}, ${a.state}` : a[key]
      const bValue = key === 'location' ? `${b.city}, ${b.state}` : b[key]

      if (typeof aValue === 'string') {
        return aValue.localeCompare(bValue) * sortDirection
      }

      return (aValue - bValue) * sortDirection
    })

    return sorted
  }, [filteredStores, sortConfig])

  const summary = useMemo(() => {
    const totals = filteredStores.reduce(
      (acc, store) => {
        acc.sales += store.weeklySales
        acc.target += store.weeklyTarget
        acc.labor += store.laborCostPercent
        acc.food += store.foodCostPercent
        if (store.alerts.length > 0) acc.alertCount += 1
        return acc
      },
      { sales: 0, target: 0, labor: 0, food: 0, alertCount: 0 },
    )

    const storeCount = filteredStores.length || 1

    const salesVariance = totals.sales - totals.target

    return {
      totalSales: totals.sales,
      totalTarget: totals.target,
      totalSalesVsTarget: (totals.sales / totals.target) * 100,
      salesVariance,
      salesVarianceDirection: salesVariance >= 0 ? 'above' : 'below',
      avgLabor: totals.labor / storeCount,
      avgFood: totals.food / storeCount,
      alertStores: totals.alertCount,
    }
  }, [filteredStores])

  function toggleSort(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }

      return { key, direction: 'asc' }
    })
  }

  function sortArrow(key) {
    if (sortConfig.key !== key) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Tice Hub Store Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">22-store performance overview across FL, GA, AL, SC, and NC.</p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Weekly Sales vs Target</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              summary.totalSalesVsTarget >= 100 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {summary.totalSalesVsTarget.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {summary.salesVariance >= 0 ? '+' : '-'}
            {currency.format(Math.abs(summary.salesVariance))} {summary.salesVarianceDirection} target
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average Labor %</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary.avgLabor.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-slate-300">Target baseline: 30%</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average Food Cost %</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary.avgFood.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-slate-300">Target baseline: 31%</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Stores with Active Alerts</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary.alertStores}</p>
          <p className="mt-1 text-sm text-slate-300">Stores with one or more alerts</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {regions.map((region) => {
            const isActive = activeRegion === region
            return (
              <button
                key={region}
                type="button"
                onClick={() => setActiveRegion(region)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {region}
              </button>
            )
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead>
              <tr>
                {Object.entries(columnConfig).map(([key, column]) => (
                  <th key={key} scope="col" className="px-3 py-3 text-left font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 text-slate-200 hover:text-white"
                    >
                      {column.label}
                      <span className="text-xs text-slate-400">{sortArrow(key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedStores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-800/60">
                  <td className="px-3 py-3 font-medium text-white">{store.name}</td>
                  <td className="px-3 py-3 text-slate-300">{store.city}, {store.state}</td>
                  <td className="px-3 py-3">{currency.format(store.weeklySales)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${metricPillClass(getSalesStatus(store.salesVsTarget))}`}>
                      {store.salesVsTarget.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${metricPillClass(getCostStatus(store.laborCostPercent, store.laborTarget))}`}>
                      {store.laborCostPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${metricPillClass(getCostStatus(store.foodCostPercent, store.foodCostTarget))}`}>
                      {store.foodCostPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${metricPillClass(getSatisfactionStatus(store.customerSatisfaction))}`}>
                      {store.customerSatisfaction.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
