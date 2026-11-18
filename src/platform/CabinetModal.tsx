import { FormEvent, useState } from 'react'
import { Building2, User } from 'lucide-react'
import { Modal, cx } from '../components/ui'
import { useAccount } from '../account'

export default function CabinetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCabinet } = useAccount()
  const [type, setType] = useState<'individual' | 'legal'>('legal')
  const [name, setName] = useState('')
  const [inn, setInn] = useState('')
  const [kpp, setKpp] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addCabinet({ type, name: name || (type === 'legal' ? 'Новая компания' : 'Личный кабинет'), inn: inn || undefined, kpp: kpp || undefined })
    setName('')
    setInn('')
    setKpp('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый кабинет">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {([
            ['individual', 'Физическое лицо', 'Оплата картой', User],
            ['legal', 'Юридическое лицо', 'Счета, ЭДО, команда', Building2],
          ] as const).map(([v, t, d, Icon]) => (
            <button
              type="button"
              key={v}
              onClick={() => setType(v)}
              className={cx('rounded-2xl border p-4 text-left transition', type === v ? 'border-violet-500/60 bg-violet-500/10' : 'border-white/10 hover:border-white/20')}
            >
              <Icon className={cx('h-5 w-5', type === v ? 'text-violet-300' : 'text-slate-400')} />
              <div className="mt-3 text-sm font-medium text-white">{t}</div>
              <div className="text-xs text-slate-500">{d}</div>
            </button>
          ))}
        </div>
        <div>
          <label className="label">{type === 'legal' ? 'Название организации' : 'Название кабинета'}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'legal' ? 'ООО «Ромашка»' : 'Мои проекты'} />
        </div>
        {type === 'legal' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ИНН</label>
              <input className="input font-mono" value={inn} onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="7701234567" />
            </div>
            <div>
              <label className="label">КПП</label>
              <input className="input font-mono" value={kpp} onChange={(e) => setKpp(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="770101001" />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Отмена</button>
          <button className="btn-primary">Создать кабинет</button>
        </div>
      </form>
    </Modal>
  )
}
