# Portfolio 1.0

## Технические задания

- [Основное публичное портфолио](./TZ.md)
- [Локальная административная система](./ADMIN_TZ.md)
- [Контракт данных раздела «Карьера»](./CAREER_DATA_CONTRACT.md)
- [Локальный редактор карьеры](./CAREER_ADMIN_TZ.md)
- [Публичная страница «Карьера»](./CAREER_PUBLIC_TZ.md)

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
├── career/
│   ├── career.json
│   └── resume/
│       └── resume.pdf
└── projects/
    └── project-id/
        ├── project.json
        ├── cover.webp
        ├── gallery/
        └── files/
```

Контракты `project.json` и `profile.json` приведены в [TZ.md](./TZ.md), а `career.json` — в [CAREER_DATA_CONTRACT.md](./CAREER_DATA_CONTRACT.md). Все пути к медиа в JSON относительные.

### Технологии в profile.json

Рекомендуемый формат группирует технологии по категориям. `icon` может содержать относительный путь внутри `portfolio/` или абсолютный HTTPS URL. Поле `url` необязательное и делает элемент кликабельным.

```json
{
  "technologies": [
    {
      "category": "Frontend",
      "items": [
        { "name": "React", "icon": "icons/react.svg", "url": "https://react.dev" },
        { "name": "Next.js", "icon": "icons/nextjs.svg", "url": "https://nextjs.org" },
        { "name": "TypeScript", "icon": "icons/typescript.svg" }
      ]
    },
    {
      "category": "Backend",
      "items": [
        { "name": "NestJS", "icon": "icons/nestjs.svg" },
        { "name": "Node.js", "icon": "icons/nodejs.svg" },
        "REST API"
      ]
    }
  ]
}
```

Старый формат массива строк также поддерживается.

### Ключевые технологии в project.json

Для технологий проекта поддерживаются строки и объекты. Абсолютный `icon` загружается напрямую. Путь `icons/python.svg` загружается из общей папки `portfolio/icons/` в Object Storage, а `./icons/python.svg` — из папки конкретного проекта. `url` необязателен.

```json
{
  "technologies": [
    {
      "name": "Python",
      "icon": "https://api.iconify.design/simple-icons:python.svg",
      "url": "https://www.python.org"
    },
    {
      "name": "PostgreSQL",
      "icon": "https://api.iconify.design/simple-icons:postgresql.svg"
    },
    "REST API"
  ]
}
```

## Проверка

```bash
npm test
npm run build
```

## GitHub Pages

1. В Settings → Pages выберите Source: **GitHub Actions**. Это обязательная одноразовая настройка до первого запуска workflow.
2. В Settings → Secrets and variables → Actions → Variables добавьте `VITE_STORAGE_BASE_URL` и, при необходимости, `VITE_PORTFOLIO_PREFIX`.
3. Выполните push в `main` — workflow соберёт и опубликует `dist/`.

Production-путь определяется автоматически из метаданных GitHub Pages. `VITE_BASE_PATH` нужен только для локальной или нестандартной сборки.
