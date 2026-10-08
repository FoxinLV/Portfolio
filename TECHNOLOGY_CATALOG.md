# Справочник технологий

## Размещение в Yandex Object Storage

Файл `technology-catalog.s3.json` нужно загрузить в бакет по пути:

```text
portfolio/technologies.json
```

Иконки уже указаны относительно `portfolio/`, например `icons/react-original.svg`. Все 49 уникальных файлов иконок проверены в публичном Object Storage.

## Формат

- `categories`: порядок и видимые русские названия груп.
- `technologies[].id`: стабильный английский идентификатор.
- `technologies[].name`: название, которое должно совпадать с названием в `project.json`.
- `technologies[].icon`: путь к иконке.
- `technologies[].category`: английский `id` группы.
- `order`: явный порядок групп и технологий.

## Страница «Обо мне»

Сайт берёт группы, порядок и иконки из `portfolio/technologies.json`. Файл `profile-technologies.s3.json` содержит тот же набор в формате поля `technologies` для `profile.json` и может использоваться как резервный вариант.

Если `technologies.json` временно недоступен, «Хронология» продолжит показывать технологии из проектов, а «Обо мне» — группы из `profile.json`.
