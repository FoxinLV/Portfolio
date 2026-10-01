# Portfolio 1.0

Статическое портфолио на React, Vite и TypeScript. Приложение размещается на GitHub Pages, а проекты и профиль получает напрямую из публичного Yandex Object Storage.

## Локальный запуск

```bash
npm install
copy .env.example .env
npm run dev
```

В `.env` укажите URL bucket без завершающего слеша:

```env
VITE_STORAGE_BASE_URL=https://storage.yandexcloud.net/my-portfolio-bucket
VITE_PORTFOLIO_PREFIX=portfolio
```

## Object Storage

Bucket должен разрешать анонимное чтение объектов и List Objects. CORS должен разрешать `GET` и `HEAD` с `http://localhost:5173` и production-домена GitHub Pages.

Ожидаемая структура:

```text
portfolio/
├── profile.json
└── projects/
    └── project-id/
        ├── project.json
        ├── cover.webp
        ├── gallery/
        └── files/
```

Контракты `project.json` и `profile.json` приведены в [TZ.md](./TZ.md). Все пути к медиа в JSON относительные.

## Проверка

```bash
npm test
npm run build
```

## GitHub Pages

1. В Settings → Pages выберите Source: **GitHub Actions**.
2. В Settings → Secrets and variables → Actions → Variables добавьте `VITE_STORAGE_BASE_URL` и, при необходимости, `VITE_PORTFOLIO_PREFIX`.
3. Выполните push в `main` — workflow соберёт и опубликует `dist/`.

Если репозиторий называется не `portfolio`, измените `base` в `vite.config.ts`.
