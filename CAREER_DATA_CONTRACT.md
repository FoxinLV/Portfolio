# Контракт данных раздела «Карьера»

## 1. Назначение

Документ определяет единый формат данных для двух систем:

1. локального Portfolio Admin, который создаёт, проверяет и публикует карьерные данные;
2. публичного портфолио на GitHub Pages, которое читает данные из Yandex Object Storage.

Контракт поддерживает:

- несколько одновременных мест работы;
- несколько периодов и должностей в одной организации;
- смену роли без создания дубликата компании;
- явный момент и тип перехода между должностями;
- отдельное описание обязанностей, выполненной работы, результатов и ключевых фактов для каждой должности;
- основную работу, совместительство, контракт, фриланс и собственный проект;
- связь конкретного проекта с конкретной ролью и периодом;
- отображение проектов внутри карьеры и карьерного контекста внутри проекта;
- черновики и независимую публичность сущностей;
- развитие схемы без поломки старого frontend.
- публикацию PDF-резюме и управляемой ссылки на резюме hh.ru.

---

## 2. Основной принцип модели

Данные разделяются на четыре сущности:

```text
Organization
    │
    └── Engagement (роль / период занятости)
             │
             └── ProjectAssignment ─── Project
```

- `Organization` — компания, заказчик, собственный бренд или команда.
- `Engagement` — конкретная роль в конкретной организации с датами начала и окончания.
- `ProjectAssignment` — участие в существующем проекте портфолио в рамках конкретной роли.
- `Project` — существующий `portfolio/projects/{projectId}/project.json`.

Параллельная работа не является исключением или ошибкой: интервалы `Engagement` могут пересекаться в любых сочетаниях.

Переход на новую должность оформляется новым `Engagement`. Новая запись может содержать `transitionFrom`, который связывает её с предыдущей ролью и описывает повышение, горизонтальный переход, расширение ответственности, возвращение или изменение формата сотрудничества.

---

## 3. Источник истины

Основной объект:

```text
portfolio/career/career.json
```

Он является единственным источником истины для:

- организаций;
- периодов занятости;
- ролей;
- связей между карьерой и проектами;
- ручного порядка отображения карьерных записей.

Связь с карьерой не дублируется в каждом `project.json`. Публичный frontend загружает `career.json`, создаёт индекс по `projectId` и показывает карьерный контекст на странице проекта. Это исключает ситуацию, когда связь удалена в одном JSON, но осталась в другом.

---

## 4. Структура Object Storage

```text
portfolio/
├── profile.json
├── career/
│   ├── career.json
│   ├── resume/
│   │   └── vitaly-lifanov-resume.pdf
│   └── organizations/
│       ├── foxin/
│       │   ├── logo.webp
│       │   └── cover.webp
│       └── company-id/
│           ├── logo.webp
│           └── cover.webp
└── projects/
    └── project-id/
        ├── project.json
        ├── cover.webp
        ├── gallery/
        └── files/
```

Все пути к карьерным изображениям внутри JSON относительны каталогу `portfolio/`:

```text
career/organizations/company-id/logo.webp
```

Абсолютные URL для загружаемых владельцем изображений не используются.

---

## 5. Полный пример `career.json`

```json
{
  "schemaVersion": 1,
  "status": "published",
  "updatedAt": "2026-10-07T15:00:00Z",
  "headline": "Создаю цифровые продукты, аналитику и инфраструктуру",
  "summary": "Опыт параллельной работы над продуктами, внутренними системами и собственными проектами.",
  "settings": {
    "defaultView": "timeline",
    "showParallelWork": true,
    "showExperienceSummary": true,
    "experienceStartDate": "2018-06-01"
  },
  "resume": {
    "pdf": {
      "enabled": true,
      "path": "career/resume/vitaly-lifanov-resume.pdf",
      "fileName": "Vitaly-Lifanov-Resume.pdf",
      "label": "Скачать резюме в PDF",
      "updatedAt": "2026-10-07T15:00:00Z"
    },
    "hh": {
      "enabled": true,
      "url": "https://hh.ru/resume/example",
      "label": "Резюме на hh.ru"
    }
  },
  "organizations": [
    {
      "id": "company-alpha",
      "status": "published",
      "name": "Компания Альфа",
      "shortName": "Альфа",
      "kind": "company",
      "description": "Разработка цифровых продуктов и внутренних информационных систем.",
      "website": "https://example.com",
      "location": "Москва, Россия",
      "foundedYear": 2012,
      "logo": "career/organizations/company-alpha/logo.webp",
      "cover": "career/organizations/company-alpha/cover.webp",
      "industry": {
        "id": "information-technology",
        "name": "Информационные технологии"
      },
      "facts": [
        { "label": "Формат", "value": "Продуктовая разработка" },
        { "label": "География", "value": "Россия" }
      ],
      "order": 20
    },
    {
      "id": "foxin",
      "status": "published",
      "name": "FOXIN",
      "shortName": "FOXIN",
      "kind": "own-project",
      "description": "Собственные цифровые продукты и инженерные проекты.",
      "location": "Москва, Россия",
      "logo": "career/organizations/foxin/logo.webp",
      "order": 10
    }
  ],
  "engagements": [
    {
      "id": "alpha-senior-developer",
      "status": "published",
      "organizationId": "company-alpha",
      "title": "Старший разработчик",
      "employmentType": "full-time",
      "workMode": "hybrid",
      "startDate": "2024-02-01",
      "endDate": "2026-01-31",
      "datePrecision": "month",
      "location": "Москва, Россия",
      "summary": "Разработка внутренних продуктов, интеграций и аналитических инструментов.",
      "responsibilities": [
        "Проектирование архитектуры приложений",
        "Разработка frontend и backend",
        "Интеграция с внутренними системами"
      ],
      "activities": [
        "Проводил декомпозицию задач и согласовывал технические решения",
        "Разрабатывал интерфейсы, API и интеграционные процессы",
        "Настраивал выпуск и сопровождение приложений"
      ],
      "achievements": [
        "Автоматизированы ключевые ручные операции",
        "Сокращено время подготовки отчётности"
      ],
      "keyFacts": [
        { "label": "Основной фокус", "value": "Внутренние продукты" },
        { "label": "Зона ответственности", "value": "Полный цикл разработки" }
      ],
      "technologies": ["TypeScript", "React", "Node.js", "PostgreSQL"],
      "skills": ["Архитектура", "Интеграции", "Аналитика"],
      "accentColor": "#2867e8",
      "featured": true,
      "order": 30
    },
    {
      "id": "alpha-lead-developer",
      "status": "published",
      "organizationId": "company-alpha",
      "title": "Ведущий разработчик",
      "employmentType": "full-time",
      "workMode": "hybrid",
      "startDate": "2026-02-01",
      "endDate": null,
      "datePrecision": "month",
      "transitionFrom": {
        "engagementId": "alpha-senior-developer",
        "type": "promotion",
        "date": "2026-02-01",
        "title": "Переход на позицию ведущего разработчика",
        "description": "Расширена ответственность за архитектуру и технические решения команды."
      },
      "summary": "Техническое руководство разработкой продуктов и интеграций.",
      "responsibilities": ["Архитектурные решения", "Техническое планирование"],
      "activities": ["Проводил архитектурные ревью", "Координировал реализацию технических инициатив"],
      "achievements": ["Унифицированы подходы к разработке и выпуску"],
      "keyFacts": [
        { "label": "Переход", "value": "Повышение внутри компании" },
        { "label": "Фокус", "value": "Архитектура и техническое лидерство" }
      ],
      "technologies": ["TypeScript", "React", "Node.js", "PostgreSQL"],
      "skills": ["Архитектура", "Техническое лидерство"],
      "accentColor": "#2867e8",
      "featured": true,
      "order": 40
    },
    {
      "id": "foxin-founder",
      "status": "published",
      "organizationId": "foxin",
      "title": "Основатель и разработчик",
      "employmentType": "self-employed",
      "workMode": "remote",
      "startDate": "2023-05-01",
      "endDate": null,
      "datePrecision": "month",
      "summary": "Параллельная разработка собственных продуктов полного цикла.",
      "responsibilities": [
        "Исследование и постановка задач",
        "Проектирование продукта",
        "Разработка, запуск и сопровождение"
      ],
      "activities": [
        "Создавал прототипы",
        "Разрабатывал и публиковал приложения",
        "Собирал обратную связь и развивал продукты"
      ],
      "achievements": [],
      "keyFacts": [
        { "label": "Формат", "value": "Собственные продукты" }
      ],
      "technologies": ["React", "NestJS", "Yandex Cloud"],
      "skills": ["Product development", "Full-stack"],
      "accentColor": "#7a4ce0",
      "featured": true,
      "order": 20
    }
  ],
  "projectAssignments": [
    {
      "id": "alpha-senior-bvs-analytics",
      "status": "published",
      "engagementId": "alpha-senior-developer",
      "projectId": "bvs-analytics",
      "startDate": "2024-03-01",
      "endDate": "2025-01-31",
      "datePrecision": "month",
      "role": "Архитектор и full-stack разработчик",
      "contribution": "Спроектировал модель данных, API и аналитический интерфейс.",
      "participationTypes": ["architecture", "development", "analytics"],
      "highlights": [
        "Единый контур аналитики",
        "Автоматическое обновление данных"
      ],
      "featured": true,
      "order": 20
    },
    {
      "id": "foxin-founder-portfolio",
      "status": "published",
      "engagementId": "foxin-founder",
      "projectId": "portfolio",
      "startDate": "2026-08-01",
      "endDate": null,
      "datePrecision": "month",
      "role": "Автор и разработчик",
      "contribution": "Спроектировал и реализовал публичное портфолио и локальную систему управления контентом.",
      "participationTypes": ["product", "design", "development", "infrastructure"],
      "highlights": [],
      "featured": true,
      "order": 10
    }
  ]
}
```

---

## 6. Корневой объект

| Поле | Тип | Обязательное | Назначение |
|---|---|---:|---|
| `schemaVersion` | integer | да | Версия контракта, в первой версии `1` |
| `status` | enum | да | `draft`, `published`, `archived` |
| `updatedAt` | ISO datetime | да | Время последней успешной публикации в UTC |
| `headline` | string | да | Короткий заголовок карьерной страницы |
| `summary` | string | да | Вводное описание |
| `settings` | object | да | Параметры публичного отображения |
| `resume` | object | нет | Публичный PDF и ссылка на hh.ru |
| `organizations` | array | да | Организации |
| `engagements` | array | да | Роли и периоды работы |
| `projectAssignments` | array | да | Связи ролей с проектами |

Неизвестные необязательные поля frontend версии 1 должен игнорировать.

---

## 7. `settings`

```ts
interface CareerSettings {
  defaultView: 'timeline' | 'organizations';
  showParallelWork: boolean;
  showExperienceSummary: boolean;
  experienceStartDate?: string;
}
```

`experienceStartDate` используется только как редакторская нижняя граница опыта. Рассчитанный стаж должен основываться на опубликованных интервалах. Если дата расходится с интервалами, Local Admin показывает предупреждение.

---

## 8. `Organization`

```ts
type OrganizationKind =
  | 'company'
  | 'client'
  | 'agency'
  | 'own-project'
  | 'freelance'
  | 'community'
  | 'education'
  | 'other';

interface CareerOrganization {
  id: string;
  status: 'draft' | 'published' | 'archived';
  name: string;
  shortName?: string;
  kind: OrganizationKind;
  description?: string;
  website?: string;
  location?: string;
  foundedYear?: number;
  logo?: string;
  cover?: string;
  industry?: { id: string; name: string };
  facts?: { label: string; value: string }[];
  order?: number;
}
```

Одна организация создаётся один раз. Повышение, возвращение в компанию или параллельная вторая роль оформляются новыми `Engagement` с тем же `organizationId`.

Публичная продолжительность работы в организации вычисляется как объединение всех опубликованных интервалов её ролей. Пересекающиеся должности внутри одной компании не суммируются дважды. Разрыв между периодами не включается в продолжительность, но интерфейс может отдельно показать количество периодов.

---

## 9. `Engagement`

```ts
type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'freelance'
  | 'self-employed'
  | 'internship'
  | 'volunteer'
  | 'project-based'
  | 'other';

type WorkMode = 'office' | 'remote' | 'hybrid' | 'field' | 'mixed';

interface CareerEngagement {
  id: string;
  status: 'draft' | 'published' | 'archived';
  organizationId: string;
  title: string;
  employmentType: EmploymentType;
  workMode?: WorkMode;
  startDate: string;
  endDate: string | null;
  datePrecision: 'day' | 'month' | 'year';
  location?: string;
  summary: string;
  responsibilities?: string[];
  activities?: string[];
  achievements?: string[];
  keyFacts?: { label: string; value: string }[];
  transitionFrom?: CareerTransition;
  technologies?: string[];
  skills?: string[];
  accentColor?: string;
  featured?: boolean;
  order?: number;
}

type CareerTransitionType =
  | 'promotion'
  | 'lateral'
  | 'expanded-scope'
  | 'contract-change'
  | 'return'
  | 'reorganization'
  | 'other';

interface CareerTransition {
  engagementId: string;
  type: CareerTransitionType;
  date: string;
  title: string;
  description?: string;
}
```

`endDate: null` означает «по настоящее время». Пересечение дат между любыми `Engagement` разрешено. Поля `primary`, `secondary` и «главная работа» намеренно отсутствуют: система не должна сама устанавливать иерархию между параллельными занятиями. При необходимости смысл указывается через `employmentType` и описание.

Смысл текстовых блоков роли:

- `summary` — назначение и общий смысл должности;
- `responsibilities` — за что отвечал;
- `activities` — что фактически делал в ежедневной/проектной работе;
- `achievements` — каких результатов достиг;
- `keyFacts` — короткие структурированные факты, показываемые в конце карточки.

`transitionFrom.date` обычно совпадает с `startDate` новой роли. Исходная и новая роли должны принадлежать одной организации, кроме типа `other`, для которого Local Admin требует явного пояснения. Предыдущая роль может закончиться в день перед переходом или пересекаться с новой во время передачи обязанностей.

---

## 10. Публичные источники резюме

```ts
interface CareerResume {
  pdf?: {
    enabled: boolean;
    path: string;
    fileName: string;
    label?: string;
    updatedAt: string;
  };
  hh?: {
    enabled: boolean;
    url: string;
    label?: string;
  };
}
```

- PDF хранится в Object Storage и открывается/скачивается как файл.
- `fileName` задаёт безопасное имя для атрибута `download`.
- Ссылка hh.ru управляется из Local Admin и ведёт на публичное резюме или предоставленный пользователем URL.
- Сайт не пытается автоматически скачивать или копировать закрытое содержимое hh.ru.
- Разрешены только HTTPS-ссылки домена `hh.ru` и его документированных поддоменов.
- Если ссылка требует авторизации на hh.ru, публичный сайт честно открывает её как внешнюю страницу и не обещает прямое скачивание.

---

## 11. `ProjectAssignment`

```ts
type ParticipationType =
  | 'research'
  | 'product'
  | 'management'
  | 'architecture'
  | 'design'
  | 'development'
  | 'analytics'
  | 'infrastructure'
  | 'integration'
  | 'support'
  | 'other';

interface CareerProjectAssignment {
  id: string;
  status: 'draft' | 'published' | 'archived';
  engagementId: string;
  projectId: string;
  startDate?: string;
  endDate?: string | null;
  datePrecision?: 'day' | 'month' | 'year';
  role?: string;
  contribution?: string;
  participationTypes?: ParticipationType[];
  highlights?: string[];
  featured?: boolean;
  order?: number;
}
```

Один проект может иметь несколько назначений, если он:

- выполнялся в нескольких компаниях;
- продолжался после смены роли;
- был передан из клиентской работы в собственное сопровождение;
- включал явно разные фазы участия.

Frontend не объединяет такие записи молча. На странице проекта показываются все опубликованные назначения с пояснением роли и периода.

---

## 12. Идентификаторы

Все `id`:

- уникальны внутри своего массива;
- соответствуют `[a-z0-9-]+`;
- не меняются после первой публикации;
- не содержат даты как единственный смысл;
- используются как стабильные якоря и ссылки.

Рекомендуемые форматы:

```text
organization: company-alpha
engagement: company-alpha-senior-developer
assignment: company-alpha-senior-bvs-analytics
```

---

## 13. Правила дат и параллельной работы

- формат хранения — `YYYY-MM-DD`;
- `datePrecision` управляет отображением, но не меняет формат хранения;
- `endDate` не может быть раньше `startDate`;
- несколько открытых интервалов с `endDate: null` разрешены;
- пересечение интервалов разных организаций разрешено;
- пересечение ролей одной организации разрешено, но Local Admin показывает предупреждение для проверки;
- даты назначения проекта должны попадать внутрь интервала роли; выход за границы блокирует публикацию либо требует исправления роли;
- отсутствие дат назначения означает использование дат `Engagement` только для группировки, но не утверждает, что проект длился весь период работы.

### Расчёт общего стажа

Общий календарный стаж рассчитывается как длина объединения опубликованных интервалов, а не их сумма:

```text
2019–2022 в компании A
2021–2023 в компании B
= 4 года календарного опыта, а не 6 лет
```

Дополнительно можно показывать «суммарно по ролям», но только с явной подписью, что параллельные периоды суммируются.

---

## 14. Правила публичности

Сущность видна публично, если:

- корневой `career.status === 'published'`;
- её собственный `status === 'published'`;
- все обязательные родительские сущности опубликованы.

Назначение проекта показывается, если опубликованы:

1. `career.json`;
2. `ProjectAssignment`;
3. соответствующий `Engagement`;
4. соответствующая `Organization`;
5. соответствующий `project.json`.

Черновое назначение не должно раскрывать существование чернового или конфиденциального проекта.

---

## 15. Правила целостности

Публикация блокируется, если:

- есть повторяющиеся ID;
- `organizationId` не существует;
- `transitionFrom.engagementId` не существует, ссылается на эту же роль или создаёт цикл;
- переход между должностями ссылается на другую организацию без допустимого пояснения;
- `engagementId` не существует;
- `projectId` не найден среди проектов;
- опубликованная дочерняя сущность ссылается на draft/archived родителя;
- дата окончания раньше даты начала;
- дата назначения выходит за интервал роли;
- путь содержит `..`, обратный слеш или абсолютный локальный путь;
- URL использует протокол, отличный от `https`;
- обязательная строка пустая;
- цвет не соответствует формату `#RRGGBB`;
- `schemaVersion` не поддерживается.
- включённый PDF отсутствует в S3 или имеет небезопасный путь;
- включённая ссылка hh.ru не является допустимым HTTPS URL hh.ru.

Предупреждение, но не блокировка:

- пересечение двух ролей одной организации;
- три и более одновременных ролей;
- опубликованная роль без проектов;
- проект без дат назначения;
- организация без логотипа;
- очень длинный текст;
- одинаковые `projectId + engagementId` в нескольких назначениях.
- дата перехода отличается от начала новой роли;
- между связанными должностями есть необъяснённый большой разрыв.

---

## 16. Нормализация и отображение

- исходные тексты хранятся без HTML;
- переносы строк разрешены только в многострочных полях;
- технологии и навыки дедуплицируются без учёта регистра;
- URL компании не используется как идентификатор;
- `order` — целое число; большее значение показывается раньше внутри равной даты;
- основной порядок ролей: `startDate DESC`, затем `order DESC`, затем `id ASC`;
- основной порядок назначений: `featured DESC`, `order DESC`, `startDate DESC`;
- пустые массивы допускаются, отсутствующие необязательные массивы трактуются как пустые.

---

## 17. Изменения в существующем `project.json`

Для версии 1 обязательное изменение схемы `project.json` не требуется. Связи строятся из `career.json`.

Frontend формирует обратный индекс:

```ts
Map<projectId, CareerProjectAssignment[]>
```

и на странице проекта показывает:

- организацию;
- должность;
- период участия;
- роль в проекте;
- вклад;
- ссылку на соответствующую запись карьеры.

В будущей версии допускается генерировать вычисляемое поле `careerRefs` при экспорте, но оно не должно становиться вторым источником истины.

---

## 18. Версионирование

- первая версия: `schemaVersion: 1`;
- добавление необязательных полей не требует новой major-версии;
- изменение смысла полей или обязательности требует `schemaVersion: 2`;
- Local Admin должен уметь прочитать поддерживаемую старую версию и предложить миграцию;
- неизвестную будущую версию нельзя перезаписывать старым редактором;
- публичный frontend показывает контролируемую ошибку при неподдерживаемой версии.

---

## 19. JSON Schema и TypeScript

Контракт должен быть реализован одновременно как:

```text
shared/schemas/career.schema.json
shared/types/career.ts
```

JSON Schema используется:

- в форме Local Admin;
- перед записью в S3;
- в тестах fixtures;
- в CI;
- при загрузке публичным frontend.

TypeScript-типы не заменяют runtime-валидацию.

---

## 20. Миграция из `profile.experience`

Текущее необязательное поле:

```text
profile.experience: string[]
```

считается устаревающим после запуска карьерного раздела.

Миграция:

1. Local Admin обнаруживает старые строки.
2. Показывает мастер ручного сопоставления с организациями и ролями.
3. Не пытается автоматически угадывать даты и компании.
4. После успешной публикации `career.json` публичная страница использует его.
5. Поле `profile.experience` можно временно оставить для обратной совместимости, но не редактировать в двух местах.

---

## 21. Критерии готовности контракта

1. Один JSON описывает компании, роли и связи с проектами.
2. Три одновременные работы проходят валидацию.
3. Повышение в одной компании моделируется отдельной ролью.
4. Один проект может относиться к нескольким ролям.
5. Проектные связи строятся в обе стороны без дублирования данных.
6. Общий стаж не завышается из-за параллельных периодов.
7. Draft-сущности не раскрываются публично.
8. Все ссылки проходят проверку ссылочной целостности.
9. Пример JSON проходит JSON Schema.
10. Старый frontend не ломается от появления каталога `career/`.
11. Переход между двумя должностями отображается отдельным событием без дублирования компании.
12. Для каждой роли независимо хранятся обязанности, выполненные действия, достижения и ключевые факты.
13. Продолжительность работы в компании не завышается пересекающимися ролями.
14. PDF-резюме и ссылка hh.ru управляются через тот же публичный контракт.
