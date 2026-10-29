# PBT · Внешние приложения

Публичный комплект для разработчиков приложений фотобудки: браузерный SDK, спецификация API и документация в Markdown и HTML.

**Текущий результат — этап 1: зафиксированный контракт SDK.** Самостоятельная песочница и полноценное демонстрационное приложение разрабатываются следующими этапами. [План и состояние](docs/ROADMAP.md).

## Документация

- [Справочник SDK в Markdown](docs/API.md) · [HTML](docs/api.html)
- [Совместимость и проверка контракта](docs/COMPATIBILITY.md)
- [План этапов](docs/ROADMAP.md)
- [Как менять документацию](docs/CONTRIBUTING.md)
- [HTML-документация целиком](docs/index.html): навигация, поиск методов и копирование примеров.
- Схемы: [OpenAPI runtime](docs/openapi.json), [service.json](docs/service.schema.json).

HTML-файлы уже находятся в репозитории. После клонирования можно открыть `docs/index.html` прямо в браузере, без установки Python, Electron или оборудования. На GitHub HTML просматривается как исходный файл; для сайта используется GitHub Pages.

## Работа с репозиторием

Для пересборки нужен Node.js 24+:

```sh
npm ci
npm run build
npm run check
npm test
npm run docs:serve
```

Локальный сайт: <http://127.0.0.1:4173>. В Windows при запрете PowerShell-сценариев используйте `npm.cmd` вместо `npm`.

Markdown в `docs/*.md` — источник текста. HTML и поисковый индекс генерируются командой `npm run docs:build`; редактировать их отдельно не нужно.

## Подключение SDK

В своём проекте установите пакет из локального клона:

```sh
npm install /path/to/pbt-external-apps/sdk
```

```javascript
import { ExternalClient } from '@pbt/sdk/external';

const client = new ExternalClient();
const context = await client.context();
await client.ready();
```

Для обычного HTML скопируйте [готовый ESM SDK](docs/downloads/sdk.js) рядом с сайтом и импортируйте `ExternalClient` из `./sdk.js`. Это SDK терминала: доступ к устройствам появляется только внутри запущенного внешнего приложения с назначенными правами. Самостоятельный симулятор описан в плане этапа 2.

SDK не опубликован в npm registry. Исходники и готовые файлы доступны в `sdk/src` и `sdk/dist`; типы построены только по публичному runtime API, без зависимости от внутренних пакетов терминала.

## Публикация документации

В репозитории подготовлен GitHub Actions workflow проверки и публикации HTML из `docs/` в GitHub Pages. Источник публикации в настройках Pages — **GitHub Actions**. Руководство: [GitHub Pages: custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
