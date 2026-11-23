import { useEffect, useRef, useState } from 'react'
import { ScanText, Upload, FileText, Receipt, IdCard, Table2, PenLine, Copy, Check, Download, Braces, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, Card, PageHeader, Stat, Tabs, cx } from '../../components/ui'

type DocType = 'auto' | 'invoice' | 'passport' | 'contract' | 'receipt' | 'table' | 'handwriting'
type Field = { key: string; label: string; value: string; conf: number; ln: number }
type Job = { id: string; file: string; type: DocType; pages: number; status: 'done' | 'processing'; at: string; fields: Field[]; text: string }

const docTypes: { id: DocType; label: string; icon: LucideIcon }[] = [
  { id: 'auto', label: 'Автоопределение', icon: ScanText },
  { id: 'invoice', label: 'Счёт / УПД', icon: Receipt },
  { id: 'passport', label: 'Паспорт РФ', icon: IdCard },
  { id: 'contract', label: 'Договор', icon: FileText },
  { id: 'receipt', label: 'Кассовый чек', icon: Receipt },
  { id: 'table', label: 'Таблица', icon: Table2 },
  { id: 'handwriting', label: 'Рукописный текст', icon: PenLine },
]
const typeLabel = (t: DocType) => docTypes.find((d) => d.id === t)?.label ?? t

const initialJobs: Job[] = [
  {
    id: 'j1', file: 'schet_482_ot_18-11.pdf', type: 'invoice', pages: 1, status: 'done', at: 'сегодня 14:02',
    fields: [
      { key: 'number', label: 'Номер счёта', value: '482', conf: 99.6, ln: 0 },
      { key: 'date', label: 'Дата', value: '18.11.2026', conf: 99.2, ln: 0 },
      { key: 'seller', label: 'Поставщик', value: 'ООО «Северный терминал»', conf: 97.8, ln: 1 },
      { key: 'inn', label: 'ИНН поставщика', value: '7704 512 389', conf: 99.4, ln: 1 },
      { key: 'buyer', label: 'Покупатель', value: 'ООО «Лента Логистик»', conf: 96.1, ln: 2 },
      { key: 'total', label: 'Сумма с НДС', value: '184 320,00 ₽', conf: 99.8, ln: 6 },
      { key: 'vat', label: 'НДС 20%', value: '30 720,00 ₽', conf: 98.9, ln: 5 },
    ],
    text: 'Счёт на оплату № 482 от 18 ноября 2026 г.\nПоставщик: ООО «Северный терминал», ИНН 7704512389\nПокупатель: ООО «Лента Логистик»\n1. Аренда складского места, ноябрь — 153 600,00\nИтого: 153 600,00\nНДС 20%: 30 720,00\nВсего к оплате: 184 320,00 ₽',
  },
  {
    id: 'j2', file: 'dogovor_postavki_v3.pdf', type: 'contract', pages: 12, status: 'done', at: 'сегодня 11:47',
    fields: [
      { key: 'number', label: 'Номер договора', value: 'П-2026/114', conf: 98.7, ln: 0 },
      { key: 'date', label: 'Дата', value: '02.11.2026', conf: 99.1, ln: 1 },
      { key: 'seller', label: 'Сторона 1', value: 'АО «ТехноПром»', conf: 97.2, ln: 2 },
      { key: 'buyer', label: 'Сторона 2', value: 'ООО «Лента Логистик»', conf: 96.4, ln: 2 },
      { key: 'total', label: 'Цена договора', value: '2 450 000,00 ₽', conf: 98.3, ln: 3 },
      { key: 'term', label: 'Срок действия', value: 'до 31.12.2027', conf: 94.5, ln: 4 },
    ],
    text: 'Договор поставки № П-2026/114\nг. Москва, 2 ноября 2026 г.\nАО «ТехноПром», именуемое в дальнейшем «Поставщик»…\n…\n7.1. Договор действует до 31 декабря 2027 г.',
  },
  {
    id: 'j3', file: 'chek_azs_0911.jpg', type: 'receipt', pages: 1, status: 'done', at: 'вчера 19:20',
    fields: [
      { key: 'seller', label: 'Продавец', value: 'АЗС № 214', conf: 95.3, ln: 1 },
      { key: 'date', label: 'Дата и время', value: '22.11.2026 19:08', conf: 97.9, ln: 0 },
      { key: 'total', label: 'Итог', value: '3 412,50 ₽', conf: 99.1, ln: 3 },
      { key: 'fn', label: 'ФН', value: '7380440700123456', conf: 91.8, ln: 4 },
    ],
    text: 'КАССОВЫЙ ЧЕК\nАЗС № 214\nАИ-95 × 52,5 л — 3 412,50\nИТОГ: 3 412,50\nФН 7380440700123456',
  },
  {
    id: 'j4', file: 'zametki_vstrechi.png', type: 'handwriting', pages: 2, status: 'done', at: '21.11 10:15',
    fields: [],
    text: 'Встреча с подрядчиком 21.11\n— сроки: первая очередь до 15 декабря\n— нужен доступ к стенду\n— бюджет согласовать с финансами',
  },
]

function confTone(c: number) {
  return c >= 97 ? 'text-emerald-300' : c >= 93 ? 'text-amber-300' : 'text-rose-300'
}

function DocPreview({ job, hover }: { job: Job; hover: string | null }) {
  const lines = job.text.split('\n')
  return (
    <div className="theme-fixed relative mx-auto w-full max-w-md rounded-lg bg-[#f7f7f5] p-6 text-[12px] leading-5 text-[#2a2a2a] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="absolute bottom-2.5 right-3 font-mono text-[10px] text-[#9a9a9a]">стр. 1 / {job.pages}</div>
      {lines.map((l, i) => {
        const hit = job.fields.some((f) => hover === f.key && f.ln === i)
        return (
          <div key={i} className={cx('rounded-sm px-1 transition-colors', i === 0 && 'mb-2 text-[14px] font-medium', hit && 'bg-violet-500/20 outline outline-1 outline-violet-500/60')}>
            {l}
          </div>
        )
      })}
      <div className="mt-4 space-y-1.5">
        {[92, 78, 85, 60].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-[#e2e2de]" style={{ width: `${w}%` }} />)}
      </div>
    </div>
  )
}

export function Ocr() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [docType, setDocType] = useState<DocType>('auto')
  const [format, setFormat] = useState<'fields' | 'text' | 'json'>('fields')
  const [selected, setSelected] = useState('j1')
  const [hover, setHover] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const job = jobs.find((j) => j.id === selected) ?? jobs[0]

  const addFiles = (names: string[]) => {
    const fresh: Job[] = names.map((file, i) => ({
      id: `n${Date.now()}${i}`, file, type: docType === 'auto' ? 'invoice' : docType, pages: 1, status: 'processing', at: 'только что',
      fields: initialJobs[0].fields.map((f) => ({ ...f })), text: initialJobs[0].text,
    }))
    setJobs((j) => [...fresh, ...j])
    fresh.forEach((f) => {
      timers.current.push(window.setTimeout(() => setJobs((j) => j.map((x) => (x.id === f.id ? { ...x, status: 'done' } : x))), 1600))
    })
    if (fresh[0]) setSelected(fresh[0].id)
  }

  const json = JSON.stringify({ file: job.file, type: job.type, pages: job.pages, fields: Object.fromEntries(job.fields.map((f) => [f.key, f.value])) }, null, 2)
  const copy = () => {
    navigator.clipboard?.writeText(format === 'json' ? json : format === 'text' ? job.text : job.fields.map((f) => `${f.label}: ${f.value}`).join('\n')).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <PageHeader
        title="Распознавание документов (OCR)"
        subtitle="Сканы, фото и PDF в текст и структурированные поля: счета, договоры, паспорта, чеки, таблицы и рукописные заметки."
        icon={ScanText}
        badge="beta"
        actions={<button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload className="h-4 w-4" /> Загрузить документы</button>}
      />
      <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.tiff,.heic" hidden onChange={(e) => { addFiles([...(e.target.files ?? [])].map((f) => f.name)); e.target.value = '' }} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Страниц за ноябрь" value="1 284" delta="+18% к прошлому месяцу" />
        <Stat label="Средняя уверенность" value="97,6%" />
        <Stat label="Время на страницу" value="1,8 с" />
        <Stat label="Стоимость страницы" value="0,40 ₽" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* upload + settings */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles([...e.dataTransfer.files].map((f) => f.name)) }}
            onClick={() => fileRef.current?.click()}
            className={cx('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center lg:col-span-4 transition-colors', drag ? 'border-violet-500/60 bg-violet-500/[0.06]' : 'border-white/15 hover:border-white/25')}
          >
            <Upload className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
            <div className="text-sm text-white">Перетащите файлы или нажмите, чтобы выбрать</div>
            <div className="text-xs text-slate-500">PDF, JPG, PNG, TIFF, HEIC · до 50 МБ · до 300 страниц</div>
          </div>

          <Card title="Тип документа" className="min-w-0 lg:col-span-8">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {docTypes.map((d) => (
                <button key={d.id} onClick={() => setDocType(d.id)} className={cx('flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] transition-colors', docType === d.id ? 'border-violet-500/50 bg-violet-500/10 text-white' : 'border-white/[0.07] text-slate-300 hover:border-white/15')}>
                  <d.icon className={cx('h-4 w-4 shrink-0', docType === d.id ? 'text-violet-400' : 'text-slate-500')} /> {d.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Язык</label>
                <select className="input"><option>Русский + English</option><option>Русский</option><option>English</option><option>Казахский</option></select>
              </div>
              <div>
                <label className="label">Модель</label>
                <select className="input"><option>OCR Pro</option><option>OCR Fast</option><option>VLM (рукопись)</option></select>
              </div>
            </div>
          </Card>
      </div>

        {/* result */}
        <div className="card mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="min-w-0 flex-1 truncate text-sm text-white">{job.file}</span>
            <Badge>{typeLabel(job.type)}</Badge>
            <Tabs tabs={[{ id: 'fields', label: 'Поля' }, { id: 'text', label: 'Текст' }, { id: 'json', label: 'JSON' }]} value={format} onChange={setFormat} />
          </div>
          {job.status === 'processing' ? (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" /> Распознаём документ…
            </div>
          ) : (
            <div className="grid md:grid-cols-12">
              <div className="border-b border-white/[0.06] bg-ink-950 p-6 md:col-span-5 md:border-b-0 md:border-r">
                <DocPreview job={job} hover={hover} />
              </div>
              <div className="flex min-h-[420px] flex-col p-5 md:col-span-7">
                <div className="flex-1">
                  {format === 'fields' && (job.fields.length ? (
                    <dl className="divide-y divide-white/[0.05]">
                      {job.fields.map((f) => (
                        <div key={f.key} onMouseEnter={() => setHover(f.key)} onMouseLeave={() => setHover(null)} className="-mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.03]">
                          <dt className="w-36 shrink-0 text-[13px] text-slate-500">{f.label}</dt>
                          <dd className="min-w-0 flex-1 text-sm text-white">{f.value}</dd>
                          <span className={cx('meter text-xs', confTone(f.conf))}>{f.conf.toFixed(1).replace('.', ',')}%</span>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-slate-400">Для рукописного текста поля не извлекаются — смотрите вкладку «Текст».</p>
                  ))}
                  {format === 'text' && <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-300">{job.text}</pre>}
                  {format === 'json' && <pre className="overflow-x-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-5 text-slate-300">{json}</pre>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  <button onClick={copy} className="btn-ghost">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} Копировать</button>
                  <button className="btn-ghost"><Download className="h-4 w-4" /> {job.type === 'table' ? 'XLSX' : 'DOCX'}</button>
                  <button className="btn-ghost"><Braces className="h-4 w-4" /> JSON</button>
                </div>
              </div>
            </div>
          )}
        </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card title="История" className="min-w-0 xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs text-slate-500">
                  {['Файл', 'Тип', 'Страниц', 'Уверенность', 'Статус', 'Когда'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const avg = j.fields.length ? j.fields.reduce((s, f) => s + f.conf, 0) / j.fields.length : null
                  return (
                    <tr key={j.id} onClick={() => setSelected(j.id)} className={cx('cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]', j.id === job.id && 'bg-white/[0.04]')}>
                      <td className="max-w-[240px] truncate px-3 py-3 text-white">{j.file}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-300">{typeLabel(j.type)}</td>
                      <td className="px-3 py-3"><span className="meter text-slate-300">{j.pages}</span></td>
                      <td className="px-3 py-3">{j.status === 'done' && avg ? <span className={cx('meter', confTone(avg))}>{avg.toFixed(1).replace('.', ',')}%</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="whitespace-nowrap px-3 py-3">{j.status === 'done' ? <Badge tone="green">Готово</Badge> : <Badge tone="amber"><Loader2 className="h-3 w-3 animate-spin" /> В работе</Badge>}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">{j.at}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="API" className="min-w-0 xl:col-span-4">
          <p className="mb-3 text-sm text-slate-400">Тот же ключ, что и для LLM API. Ответ — текст и поля в JSON.</p>
          <pre className="overflow-x-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-5 text-slate-300">
            <span className="text-slate-500">curl</span> https://api.ai-studio.space/v1/ocr \{'\n'}
            {'  '}-H <span className="text-emerald-300">"Authorization: Bearer $KEY"</span> \{'\n'}
            {'  '}-F file=@schet_482.pdf \{'\n'}
            {'  '}-F type=invoice
          </pre>
        </Card>
      </div>
    </>
  )
}
