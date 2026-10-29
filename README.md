# PBT · Разработка приложений фотобудки

[Документация HTML](https://it-labs-top.github.io/pbt-external-apps/) · [Справочник SDK в Markdown](docs/API.md)

Материалы для автора внешнего приложения: работа с камерой, оплатой, печатью и цифровой выдачей через SDK фотобудки.

## Запустить песочницу

Нужен Node.js 24+. Из корня репозитория:

```sh
node sandbox/start.mjs
```

Откройте адрес из терминала (по умолчанию `http://127.0.0.1:4174`). npm-зависимости устанавливать не нужно. Также работает `npm start`.

Для своей готовой web-сборки: `node sandbox/start.mjs --app=C:/projects/my-app/dist`. [Инструкция и сценарии ошибок](docs/SANDBOX.md).

## Документация

- [Начало работы](docs/START.md)
- [Песочница](docs/SANDBOX.md)
- [Справочник SDK](docs/API.md)
- [Пакет приложения и разрешения](docs/PACKAGE.md)
- [Версии и совместимость](docs/VERSIONS.md)
- Схемы: [OpenAPI](docs/openapi.json), [манифест service.json](docs/service.schema.json).

Документация доступна в `.md` и готовых `.html`. Для чтения без интернета скачайте репозиторий и откройте `docs/index.html`; устанавливать зависимости не требуется.

## SDK

В проекте с npm установите готовый пакет из скачанного репозитория:

```sh
npm install /path/to/pbt-external-apps/sdk
```

```javascript
import { ExternalClient } from '@pbt/sdk/external';

const client = new ExternalClient();
const context = await client.context();
await client.ready();
```

Для обычного HTML скопируйте [sdk.js](docs/downloads/sdk.js) рядом со страницей и импортируйте `ExternalClient` из `./sdk.js`. TypeScript-декларации входят в готовый пакет `sdk/`.

SDK использует API текущего запуска приложения. Доступ к оборудованию появляется при запуске через программу фотобудки с выбранной услугой и её разрешениями; открытие страницы двойным щелчком такой запуск не создаёт. [Как устроена система](docs/START.md#как-устроена-система).
