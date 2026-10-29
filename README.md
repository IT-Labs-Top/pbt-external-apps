# PBT · Разработка приложений фотобудки

[Документация HTML](https://it-labs-top.github.io/pbt-external-apps/) · [Справочник SDK в Markdown](docs/API.md)

Материалы для автора внешнего приложения: работа с камерой, оплатой, печатью и цифровой выдачей через SDK фотобудки.

## Документация

- [Начало работы](docs/START.md)
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

SDK обращается к платформе текущего запуска. Доступ к оборудованию появляется в оболочке фотобудки с назначенной услугой и разрешениями; открытие страницы двойным щелчком такой запуск не создаёт.
