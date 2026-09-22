# Gakumas-Translation-Data-RU-Site

Простой сайт-страница для проекта [Gakumas Translation Data RU](https://github.com/HunterKrendel234/Gakumas-Translation-Data-RU) — русская локализация Gakumas для Android и ПК (DMM).

## Структура

- `index.html` — одностраничный сайт (без JS и фреймворков)
- `styles.css` — стили (светлая/тёмная тема через `prefers-color-scheme`)

## Как задеплоить на GitHub Pages

1. Создайте репозиторий на GitHub и запушьте этот репозиторий:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Откройте репозиторий на GitHub → **Settings → Pages**.
3. В блоке **Build and deployment** выберете **Source: Deploy from a branch**.
4. Укажите ветку `main`, папку `/root` и нажмите **Save**.
5. Через несколько минут сайт будет доступен по адресу `https://<your-username>.github.io/<repo-name>/`.

## TODO

- Заменить ссылку-заглушку кнопки «Статья ВК» в `index.html`.
- Заменить ссылки «Скачать для Android / ПК» на актуальные релизы.
- Написать полные инструкции по установке (пока заглушки и ссылка на Discord).