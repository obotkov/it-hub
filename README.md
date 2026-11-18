# AI Studio — IT Hub

Хаб IT-сервисов: лендинг + платформа (AI Platform, ML Platform, GPU-инференс, продуктовая аналитика Wildmetrics, BI, облако, платформа данных) с кабинетами для физ- и юрлиц.

Стек: React 18 + TypeScript + Vite + Tailwind CSS. Раздаётся Caddy (авто-HTTPS) из Docker-образа.

## Разработка

```bash
npm install
npm run dev
```

## Деплой

На сервере в `/opt/it-hub/.env` (см. `.env.example`) задаются домен и токен парольного доступа.

```bash
./deploy/deploy.sh
```

Скрипт синхронизирует исходники по SSH, собирает образ на сервере и перезапускает контейнер.
