import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export type Cabinet = {
  id: string
  type: 'individual' | 'legal'
  name: string
  inn?: string
  kpp?: string
  balance: number
}

type Ctx = {
  user: { name: string; email: string } | null
  login: (email: string) => void
  logout: () => void
  cabinets: Cabinet[]
  current: Cabinet
  setCurrent: (id: string) => void
  addCabinet: (c: Omit<Cabinet, 'id' | 'balance'>) => void
}

const defaults: Cabinet[] = [{ id: 'c1', type: 'individual', name: 'Личный кабинет', balance: 12450 }]

const load = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : d
  } catch {
    return d
  }
}
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

const AccountCtx = createContext<Ctx>(null as unknown as Ctx)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Ctx['user']>(() => load('hub.user', null))
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => load('hub.cabinets', defaults))
  const [currentId, setCurrentId] = useState<string>(() => load('hub.current', 'c1'))

  useEffect(() => {
    save('hub.user', user)
  }, [user])
  useEffect(() => {
    save('hub.cabinets', cabinets)
  }, [cabinets])
  useEffect(() => {
    save('hub.current', currentId)
  }, [currentId])

  const current = cabinets.find((c) => c.id === currentId) ?? cabinets[0]

  return (
    <AccountCtx.Provider
      value={{
        user,
        login: (email) => setUser({ email, name: email.split('@')[0] || 'Пользователь' }),
        logout: () => setUser(null),
        cabinets,
        current,
        setCurrent: setCurrentId,
        addCabinet: (c) => {
          const id = 'c' + Date.now()
          setCabinets((x) => [...x, { ...c, id, balance: 0 }])
          setCurrentId(id)
        },
      }}
    >
      {children}
    </AccountCtx.Provider>
  )
}

export const useAccount = () => useContext(AccountCtx)
