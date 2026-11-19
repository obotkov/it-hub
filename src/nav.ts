import {
  MessagesSquare, MessageSquare, Wrench, KeyRound, Plug, Puzzle, Library, Workflow, Clapperboard, Laptop,
  BrainCircuit, FlaskConical, Cpu, Server, Rocket,
  BarChart3, Gauge, FileBarChart, MousePointerClick, Filter, Split, FileJson, Smartphone,
  LayoutDashboard, DatabaseZap, Code2, BellRing,
  Cloud, HardDrive, Database, Boxes,
  Network, BookOpen, GitBranch, ShieldCheck,
  Hammer, Lock, Store, Bot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = { path: string; title: string; icon: LucideIcon; desc: string }
export type Section = {
  id: string
  title: string
  short: string
  icon: LucideIcon
  tagline: string
  items: NavItem[]
  soon?: boolean
}

export const sections: Section[] = [
  {
    id: 'ai',
    title: 'AI Platform',
    short: 'AI',
    icon: MessagesSquare,
    tagline: 'LLM-чаты, агенты, MCP и RAG в одном месте',
    items: [
      { path: 'ai/chat', title: 'Чат с LLM', icon: MessageSquare, desc: 'Десятки моделей, файлы и документы в диалоге' },
      { path: 'ai/pro-chat', title: 'Pro чат', icon: Wrench, desc: 'Чат с MCP, RAG, навыками и инструментами' },
      { path: 'ai/api', title: 'LLM API', icon: KeyRound, desc: 'OpenAI-совместимый API для ваших проектов' },
      { path: 'ai/mcp', title: 'MCP Hub', icon: Plug, desc: 'Каталог MCP-серверов для подключения инструментов' },
      { path: 'ai/skills', title: 'Skill Hub', icon: Puzzle, desc: 'Готовые навыки для агентов и ассистентов' },
      { path: 'ai/rag', title: 'RAG Hub', icon: Library, desc: 'Базы знаний из ваших документов' },
      { path: 'ai/agents', title: 'Agent World', icon: Workflow, desc: 'Визуальный конструктор workflow из агентов' },
      { path: 'ai/media', title: 'Audio / Video агенты', icon: Clapperboard, desc: 'Транскрибация, озвучка, генерация видео' },
      { path: 'ai/code-agent', title: 'Code-агент для ПК', icon: Laptop, desc: 'Десктоп-приложение для macOS и Windows' },
    ],
  },
  {
    id: 'ml',
    title: 'ML Platform',
    short: 'ML',
    icon: BrainCircuit,
    tagline: 'Обучение и запуск моделей прямо в интерфейсе',
    items: [
      { path: 'ml/overview', title: 'Проекты', icon: FlaskConical, desc: 'Эксперименты, датасеты и метрики' },
      { path: 'ml/training', title: 'Обучение', icon: Cpu, desc: 'Запуск обучения на GPU в один клик' },
      { path: 'ml/registry', title: 'Вывод моделей в прод', icon: Rocket, desc: 'Inference-сервисы: деплой, статусы и метрики' },
    ],
  },
  {
    id: 'gpu',
    title: 'GPU Инференс',
    short: 'GPU',
    icon: Server,
    tagline: 'Поды с видеокартами за минуту: ComfyUI, vLLM, PyTorch',
    items: [
      { path: 'gpu/deploy', title: 'Новый под', icon: Rocket, desc: 'Шаблон + конфигурация вычислений' },
      { path: 'gpu/pods', title: 'Мои поды', icon: Server, desc: 'Запущенные поды и их состояние' },
    ],
  },
  {
    id: 'analytics',
    title: 'Продуктовая аналитика',
    short: 'Analytics',
    icon: BarChart3,
    tagline: 'Wildmetrics: счётчик, отчёты, воронки и A/B-тесты',
    items: [
      { path: 'analytics/counters', title: 'Wildmetrics', icon: Gauge, desc: 'Счётчики и код для установки на сайт' },
      { path: 'analytics/reports', title: 'Отчёты', icon: FileBarChart, desc: 'Посещаемость, устройства, источники' },
      { path: 'analytics/heatmap', title: 'Карта кликов', icon: MousePointerClick, desc: 'Тепловая карта взаимодействий' },
      { path: 'analytics/funnels', title: 'Воронки', icon: Filter, desc: 'Конверсия по шагам' },
      { path: 'analytics/ab', title: 'AB Platform', icon: Split, desc: 'Эксперименты и метрики' },
      { path: 'analytics/raw', title: 'RawData', icon: FileJson, desc: 'Доступ к сырым событиям' },
      { path: 'analytics/apps', title: 'App Tracker', icon: Smartphone, desc: 'Установки мобильных приложений' },
    ],
  },
  {
    id: 'bi',
    title: 'BI платформа',
    short: 'BI',
    icon: LayoutDashboard,
    tagline: 'Источники, SQL, дашборды и алерты',
    items: [
      { path: 'bi/sources', title: 'Источники данных', icon: DatabaseZap, desc: 'Базы данных и файлы' },
      { path: 'bi/queries', title: 'Запросы', icon: Code2, desc: 'SQL-редактор с визуализацией' },
      { path: 'bi/dashboards', title: 'Дашборды', icon: LayoutDashboard, desc: 'Сборка отчётов из виджетов' },
      { path: 'bi/alerts', title: 'Алерты', icon: BellRing, desc: 'Уведомления по условиям' },
    ],
  },
  {
    id: 'cloud',
    title: 'Облако',
    short: 'Cloud',
    icon: Cloud,
    tagline: 'Виртуальные машины, управляемые БД и Kubernetes',
    items: [
      { path: 'cloud/vms', title: 'Серверы и VM', icon: HardDrive, desc: 'Аренда виртуальных машин' },
      { path: 'cloud/databases', title: 'Базы данных', icon: Database, desc: 'PostgreSQL, ClickHouse, Redis…' },
      { path: 'cloud/k8s', title: 'Kubernetes', icon: Boxes, desc: 'Управляемые кластеры' },
    ],
  },
  {
    id: 'data',
    title: 'Платформа данных',
    short: 'Data',
    icon: Network,
    tagline: 'Каталог, пайплайны и качество данных',
    items: [
      { path: 'data/catalog', title: 'Каталог данных', icon: BookOpen, desc: 'Таблицы, владельцы и lineage' },
      { path: 'data/pipelines', title: 'Пайплайны', icon: GitBranch, desc: 'ETL/ELT и расписания' },
      { path: 'data/quality', title: 'Качество данных', icon: ShieldCheck, desc: 'Проверки и инциденты' },
    ],
  },
  {
    id: 'soon',
    title: 'В разработке',
    short: 'Soon',
    icon: Hammer,
    tagline: 'Скоро на платформе',
    soon: true,
    items: [
      { path: 'soon/security', title: 'Security Center', icon: Lock, desc: 'Сканирование уязвимостей и секреты' },
      { path: 'soon/devops', title: 'CI/CD', icon: GitBranch, desc: 'Сборки и деплой' },
      { path: 'soon/marketplace', title: 'Маркетплейс', icon: Store, desc: 'Решения партнёров' },
      { path: 'soon/support-bot', title: 'AI-поддержка', icon: Bot, desc: 'Бот для вашего сайта' },
    ],
  },
]

export const findItem = (path: string) => {
  for (const s of sections) for (const i of s.items) if (path.endsWith(i.path)) return { section: s, item: i }
  return null
}
