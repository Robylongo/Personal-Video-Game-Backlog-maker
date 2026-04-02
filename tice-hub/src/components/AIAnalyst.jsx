import { useMemo, useState } from 'react'
import storeData from '../data/storeData'

const suggestedQuestions = [
  'Which stores are over labor budget?',
  'Where is food cost the biggest problem?',
  'Which location had the best week?',
  'What are the top 3 turnaround priorities this week?',
  'Which region has the highest risk right now?',
  'Which stores should we audit first and why?',
]

function AIAnalyst() {
  const [apiKey, setApiKey] = useState('[paste your key here]')
  const [question, setQuestion] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi, I'm TICE's operations analyst. Ask me about store performance, cost controls, risk, or action plans.",
    },
  ])

  const systemPrompt = useMemo(
    () =>
      `You are TICE's operations analyst. Give concise, actionable answers for multi-store QSR operations leadership. Use KPI math when relevant, prioritize problem stores, and recommend next actions with clear priorities.\n\nStore data context (JSON):\n${JSON.stringify(
        storeData,
      )}`,
    [],
  )

  async function sendQuestion(text) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    if (!apiKey.trim()) {
      setError('Enter an OpenAI API key to run analysis.')
      return
    }

    setError('')

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setQuestion('')
    setIsLoading(true)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
          ],
        }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || 'OpenAI request failed.')
      }

      const payload = await response.json()
      const assistantReply = payload.choices?.[0]?.message?.content?.trim()

      if (!assistantReply) {
        throw new Error('No response content returned by OpenAI.')
      }

      setMessages((current) => [...current, { role: 'assistant', content: assistantReply }])
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete request.')
    } finally {
      setIsLoading(false)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    sendQuestion(question)
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl rounded-2xl border border-[#1b2f4f] bg-[#0e1a2b] p-4 shadow-xl md:p-6">
      <header className="mb-4 border-b border-[#1b2f4f] pb-4">
        <h2 className="text-2xl font-semibold text-white">AI Operations Analyst</h2>
        <p className="mt-1 text-sm text-slate-300">
          Ask performance questions across all 22 stores using TICE's analyst assistant.
        </p>
      </header>

      <div className="mb-4">
        <label htmlFor="openai-key" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <input
            id="openai-key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-[#1b2f4f] bg-[#09101a] px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 transition focus:ring-2"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((current) => !current)}
            className="rounded-lg border border-[#34527f] bg-[#13213a] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2f4f]"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Your API key is used client-side only and is never stored.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => sendQuestion(item)}
            className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200 transition hover:bg-orange-400/20"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-4 h-[420px] overflow-y-auto rounded-xl border border-[#1b2f4f] bg-[#09101a] p-4">
        <div className="space-y-3">
          {messages.map((message, index) => {
            const isAssistant = message.role === 'assistant'
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isAssistant
                      ? 'bg-[#14253f] text-slate-100 border border-[#1b2f4f]'
                      : 'bg-orange-500 text-[#1f1306] font-medium'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor="analyst-question" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="analyst-question"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about labor variance, food cost drivers, ranking, risk, or action plans..."
          className="w-full resize-y rounded-xl border border-[#1b2f4f] bg-[#09101a] px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 transition focus:ring-2"
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-[#2a1608] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Analyzing…' : 'Send to Analyst'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AIAnalyst
