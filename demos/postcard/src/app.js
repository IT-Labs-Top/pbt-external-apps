import { ExternalClient } from '../vendor/sdk.js';
import { Operations, extraCost, canRestartPayment } from './operations.js';
import {
  loadImage,
  drawPostcard,
  jpegBlob,
  supportedFilter,
} from './postcard.js';
import { loadWeather } from './weather.js';

const $ = (id) => document.getElementById(id);
const client = new ExternalClient();
const money = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(value);
const state = {
  screen: 'loading',
  context: null,
  cameras: [],
  frames: [],
  effects: [],
  camera: 'main',
  frame: null,
  effect: null,
  busy: false,
  paused: false,
  stopped: false,
  sdkReady: false,
  basePaid: false,
  knownPayments: new Map(),
  shot: null,
  photo: null,
  outputBlob: null,
  outputId: null,
  outputUrl: null,
  design: null,
  designLocked: false,
  copies: 1,
  extraAmount: 0,
  printed: false,
  shared: null,
  weather: null,
  city: 'Самара',
  countdown: 0,
  closing: null,
  completionConfirmed: false,
};
const waits = [];
const frameImages = new Map();
let countdownTimer,
  diagnosticsTimer,
  removeLifecycle,
  retryAction = null,
  renderVersion = 0;
const weatherAbort = new AbortController();
class ClosedRun extends Error {}

const operations = new Operations((event, key, entry) => {
  const data = {
    operation: key,
    request_id: entry.requestId,
    attempt: entry.attempts,
  };
  client.track('postcard.operation.' + event, data);
  if (event === 'error')
    client.logError(entry.error, {
      ...data,
      operation_id: entry.operationId ?? '',
      job_id: entry.jobId ?? '',
      code: entry.error.code ?? '',
    });
});
function go(screen) {
  state.screen = screen;
  clearError();
  for (const section of document.querySelectorAll('[data-screen]'))
    section.hidden = section.dataset.screen !== screen;
  const step =
    screen === 'payment'
      ? 'start'
      : ['working', 'share', 'done'].includes(screen)
        ? 'delivery'
        : screen;
  for (const item of document.querySelectorAll('[data-step]'))
    item.setAttribute(
      'aria-current',
      item.dataset.step === step ? 'step' : 'false',
    );
  if (!state.stopped && state.sdkReady) client.stage('postcard.' + screen);
  updatePreview();
}
async function active() {
  if (state.stopped) throw new ClosedRun();
  if (state.paused)
    await new Promise((resolve, reject) => waits.push({ resolve, reject }));
  if (state.stopped) throw new ClosedRun();
}
function clearError() {
  retryAction = null;
  $('error').hidden = true;
  document.body.dataset.error = 'false';
}
function failure(title, message, retry, label = 'Продолжить ожидание') {
  $('error-title').textContent = title;
  $('error-message').textContent = message;
  retryAction = retry;
  $('retry').hidden = !retry;
  $('retry').textContent = label;
  $('error').hidden = false;
  document.body.dataset.error = 'true';
}
async function action(task) {
  if (state.busy || state.paused || state.stopped) return;
  state.busy = true;
  try {
    await active();
    await task();
  } catch (error) {
    if (!(error instanceof ClosedRun) && !state.stopped) {
      client.logError(error, { screen: state.screen });
      failure(
        'Не удалось продолжить',
        'Обратитесь к администратору или завершите работу через подтверждение выхода.',
        null,
      );
    }
  } finally {
    state.busy = false;
  }
}
function working(title, message) {
  go('working');
  $('working-title').textContent = title;
  $('working-progress').textContent = message;
}
function updatePreview() {
  const image = $('preview');
  if (
    state.screen === 'camera' &&
    !state.paused &&
    !state.stopped &&
    state.cameras.length
  ) {
    const url = client.previewUrl(state.camera);
    if (image.getAttribute('src') !== url) image.src = url;
  } else image.removeAttribute('src');
}
function dispose() {
  clearInterval(countdownTimer);
  clearInterval(diagnosticsTimer);
  weatherAbort.abort();
  $('preview').removeAttribute('src');
  state.countdown = 0;
  state.countdownResolve?.();
  state.countdownResolve = null;
  removeLifecycle?.();
  client.dispose();
  void client
    .flushTelemetry()
    .finally(() =>
      window.pbtSandboxDiagnostics?.reportSdkDropped(client.diagnosticsDropped),
    );
  if (state.outputUrl) {
    URL.revokeObjectURL(state.outputUrl);
    state.outputUrl = null;
  }
}
function lifecycle(event) {
  client.track('postcard.lifecycle', { event });
  if (event === 'pause') {
    state.paused = true;
    $('app').inert = true;
    $('help-dialog').inert = true;
    $('pause-note').hidden = false;
    clearInterval(countdownTimer);
    updatePreview();
  } else if (event === 'resume') {
    state.paused = false;
    $('app').inert = false;
    $('help-dialog').inert = false;
    $('pause-note').hidden = true;
    for (const waiter of waits.splice(0)) waiter.resolve();
    updatePreview();
    if (state.countdown > 0) startCountdownTimer();
  } else if (event === 'stop') {
    state.stopped = true;
    state.paused = false;
    for (const waiter of waits.splice(0)) waiter.reject(new ClosedRun());
    $('help-dialog').close();
    $('pause-note').hidden = true;
    go('done');
    $('done-title').textContent =
      state.closing === 'refund'
        ? 'Запрос проверки возврата'
        : state.completionConfirmed
          ? 'Спасибо за этот момент'
          : 'Работа завершена';
    $('done-message').textContent =
      state.closing === 'refund'
        ? 'Уточните результат проверки возврата у администратора. Принятие запроса не означает возврат денег.'
        : state.completionConfirmed
          ? 'Ваша фотооткрытка готова.'
          : 'Программа фотобудки закрыла эту сессию.';
    $('app').inert = true;
    dispose();
  }
}

// Read settings and catalogues before enabling the paid visitor scenario.
async function initialize() {
  go('loading');
  try {
    const context = await client.context();
    state.context = context;
    await client.ready();
    state.sdkReady = true;
    client.stage('postcard.loading');
    const previous = await client.state();
    if (
      previous.commands.length ||
      previous.payments.length ||
      previous.photos.length ||
      previous.printJobs.length
    ) {
      for (const payment of previous.payments)
        state.knownPayments.set(payment.operationId, payment.amountPaid);
      client.track('postcard.reload.blocked');
      updateRefundAvailability();
      go('recovery');
      return;
    }
    if (!context.permissions.includes('result:write'))
      throw new Error('Для открытки нужно разрешение result:write');
    if (context.price > 0 && !context.permissions.includes('payment'))
      throw new Error('Не разрешена оплата');
    if (
      context.fulfillment === 'print' &&
      !context.permissions.includes('print')
    )
      throw new Error('Не разрешена печать');
    const cameras = await client.cameras();
    state.cameras = cameras.cameras.filter((camera) => camera.ready);
    if (!state.cameras.length) throw new Error('Нет готовой камеры');
    state.camera = state.cameras[0].id;
    $('camera').replaceChildren(
      ...state.cameras.map((camera) => {
        const option = document.createElement('option');
        option.value = camera.id;
        option.textContent = camera.label;
        return option;
      }),
    );
    state.city =
      typeof context.config.city === 'string'
        ? context.config.city.slice(0, 40)
        : 'Самара';
    $('city').textContent = state.city;
    const permitted = context.permissions.includes('config:read');
    const [frames, effects] = await Promise.allSettled([
      permitted ? client.frames() : [],
      permitted ? client.effects() : [],
    ]);
    const frameRows = frames.status === 'fulfilled' ? frames.value : [];
    const effectRows = effects.status === 'fulfilled' ? effects.value : [];
    state.frames = frameRows.filter(
      (frame) =>
        frame.isPlain ||
        ((!frame.layout?.kind || frame.layout.kind === 'single') &&
          frame.layout?.orientation !== 'landscape' &&
          (frame.frameUrl || frame.largePhotoFrameUrl)),
    );
    if (!state.frames.some((frame) => frame.isPlain))
      state.frames.unshift({ id: null, title: 'Без рамки', isPlain: true });
    state.effects = effectRows.filter((effect) =>
      supportedFilter(effect.cssFilter),
    );
    if (!state.effects.length)
      state.effects = [{ id: null, title: 'Естественный', cssFilter: 'none' }];
    state.frame = state.frames.find((frame) => frame.isPlain);
    state.effect = state.effects[0];
    $('catalog-note').textContent =
      frames.status === 'rejected' || effects.status === 'rejected'
        ? 'Часть оформления сейчас недоступна. Базовая открытка остаётся доступной.'
        : '';
    if (frames.status === 'rejected')
      client.logError(frames.reason, { resource: 'frames' });
    if (effects.status === 'rejected')
      client.logError(effects.reason, { resource: 'effects' });
    state.date = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
    $('begin').textContent =
      context.price > 0
        ? 'Начать · ' + money(context.price)
        : 'Создать открытку';
    $('begin').disabled = false;
    $('included').textContent =
      context.fulfillment === 'print'
        ? 'Включены одна печатная открытка и цифровой файл.'
        : 'Включён цифровой файл открытки. Печать не требуется.';
    const copiesAllowed =
      context.fulfillment === 'print' &&
      (context.sheetPrice === 0 || context.permissions.includes('payment'));
    $('copies-label').hidden = !copiesAllowed;
    $('copies').value = '1';
    await active();
    go('start');
    void loadWeather(context.config.weather, { signal: weatherAbort.signal })
      .then((value) => {
        if (!value || state.stopped) return;
        state.weather = value;
        $('weather').textContent = value.text;
        $('weather').hidden = false;
        $('weather-credit').hidden = false;
        client.track('postcard.weather.loaded');
        if (state.screen === 'design' && !state.designLocked)
          void renderDesign().catch((error) =>
            client.logError(error, { resource: 'weather-render' }),
          );
      })
      .catch((error) => {
        if (!state.stopped) {
          client.track('postcard.weather.unavailable');
          client.logError(
            error,
            { resource: 'weather' },
            'postcard.weather.error',
          );
        }
      });
  } catch (error) {
    if (state.stopped) return;
    client.logError(error, { operation: 'initialize' });
    failure(
      'Пока не можем начать',
      'Проверьте подключение, доступность камеры и разрешения услуги. Если работа уже начиналась, сверяйте операции с администратором.',
      initialize,
      'Проверить ещё раз',
    );
  }
}

// Payment attempts are independent: the base service payment never confirms an extra-sheet charge.
function updatePayment(payment, entry) {
  entry.operationId = payment.operationId;
  state.knownPayments.set(payment.operationId, payment.amountPaid);
  $('amount-due').textContent = money(payment.amountDue);
  $('payment-progress').textContent =
    'Внесено ' + money(payment.amountPaid) + ' из ' + money(payment.amountDue);
  $('payment-bar').style.width =
    Math.min(100, (payment.amountPaid / payment.amountDue) * 100) + '%';
  $('payment-time').textContent =
    payment.remainingSeconds === null
      ? ''
      : 'Осталось времени: ' + payment.remainingSeconds + ' с';
  $('extend').hidden = !(
    payment.status === 'pending' &&
    payment.method === 'cash' &&
    payment.amountPaid > 0
  );
  updateRefundAvailability();
}
async function charge(key, amount) {
  await active();
  go('payment');
  $('amount-due').textContent = money(amount);
  $('payment-progress').textContent = 'Ожидаем оплату…';
  $('payment-bar').style.width = '0%';
  $('extend').hidden = true;
  $('payment-description').textContent =
    key === 'extra-payment'
      ? 'Доплата за дополнительные открытки. Основная услуга уже оплачена.'
      : 'Оплатите услугу удобным способом на устройстве.';
  const timeoutMs = timeout('paymentMs', 600000);
  return operations.run(key, { amount }, (entry) => {
    const options = {
      requestId: entry.requestId,
      timeoutMs,
      onProgress: (payment) => updatePayment(payment, entry),
    };
    return entry.operationId
      ? client.waitPayment(entry.operationId, options)
      : client.payment(entry.args.amount, options);
  });
}
function timeout(key, fallback) {
  const value = state.context?.config.timeouts?.[key];
  return Number.isInteger(value) && value >= 100 && value <= 600000
    ? value
    : fallback;
}
async function begin() {
  try {
    if (!state.basePaid && state.context.price > 0)
      await charge('base-payment', state.context.price);
    state.basePaid = true;
    await active();
    go('camera');
  } catch (error) {
    if (error instanceof ClosedRun || state.stopped) return;
    paymentFailure(error, 'base-payment', begin);
  }
}
function paymentFailure(error, key, resume) {
  if (canRestartPayment(error)) {
    failure(
      'Оплата не завершена',
      'Можно начать новую попытку. Предыдущая попытка завершилась без внесённой суммы.',
      () => {
        operations.newAttempt(key);
        return resume();
      },
      'Новая попытка оплаты',
    );
  } else if (error.code === 'failed' && error.result?.amountPaid > 0) {
    failure(
      'Внесена часть суммы',
      'Не начинайте новую оплату. Обратитесь к администратору для сверки или запросите проверку возврата через помощь.',
      null,
    );
  } else
    failure(
      'Нужно уточнить результат оплаты',
      'Ожидание прервалось. Продолжим проверять ту же оплату без нового списания.',
      resume,
    );
}
async function extend() {
  $('extend').disabled = true;
  try {
    await operations.run('extend', {}, (entry) =>
      client.extendCashWait({
        requestId: entry.requestId,
        timeoutMs: timeout('commandMs', 15000),
      }),
    );
    operations.newAttempt('extend');
  } catch (error) {
    client.logError(error, { operation: 'extend' });
    $('payment-time').textContent =
      'Продление не подтверждено. Повтор использует тот же запрос.';
  } finally {
    $('extend').disabled = false;
  }
}

// Pause freezes the countdown, while an already accepted SDK operation continues to its known outcome.
function startCountdownTimer() {
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (state.paused || state.stopped) return;
    state.countdown--;
    if (state.countdown > 0)
      $('countdown').textContent = String(state.countdown);
    else {
      clearInterval(countdownTimer);
      state.countdownResolve?.();
      state.countdownResolve = null;
    }
  }, 1000);
}
async function shoot() {
  $('shoot').disabled = true;
  $('camera').disabled = true;
  try {
    if (!operations.get('capture')) {
      state.countdown = 3;
      $('countdown').textContent = '3';
      $('countdown').hidden = false;
      await new Promise((resolve) => {
        state.countdownResolve = resolve;
        startCountdownTimer();
      });
    }
    await active();
    $('countdown').hidden = true;
    const args = operations.get('capture')?.args ?? { camera: state.camera };
    const result = await operations.run('capture', args, (entry) =>
      client.capture({
        ...entry.args,
        requestId: entry.requestId,
        timeoutMs: timeout('commandMs', 15000),
      }),
    );
    state.shot = result;
    state.photo = await loadImage(client.photoUrl(result.photoId));
    await active();
    go('design');
    renderChoices();
    await renderDesign();
  } catch (error) {
    if (error instanceof ClosedRun || state.stopped) return;
    const known = operations.get('capture')?.status === 'failed';
    failure(
      'Снимок пока не получен',
      known
        ? 'Камера сообщила об ошибке. Проверьте её доступность перед новой попыткой.'
        : 'Проверим прежний запрос снимка. Повтор не создаст второй кадр.',
      () => {
        if (known) operations.newAttempt('capture');
        return shoot();
      },
      known ? 'Снять ещё раз' : 'Проверить снимок',
    );
  } finally {
    $('shoot').disabled = false;
    $('camera').disabled = operations.get('capture')?.status === 'unknown';
    $('countdown').hidden = true;
  }
}
function renderChoices() {
  for (const [id, rows, key] of [
    ['frames', state.frames, 'frame'],
    ['effects', state.effects, 'effect'],
  ]) {
    $(id).replaceChildren(
      ...rows.map((row) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = row.title;
        button.dataset.id = String(row.id);
        button.setAttribute('aria-pressed', String(state[key]?.id === row.id));
        button.addEventListener('click', () => {
          if (state.designLocked || state.paused || state.stopped) return;
          state[key] = row;
          client.track('postcard.' + key + '.selected', { id: row.id ?? -1 });
          renderChoices();
          void renderDesign()
            .then(clearError)
            .catch((error) => {
              client.logError(error, { operation: 'render' });
              failure(
                'Оформление недоступно',
                'Выберите другую рамку или повторите загрузку.',
                renderDesign,
                'Загрузить оформление',
              );
            });
        });
        return button;
      }),
    );
  }
}
function designSettings() {
  return (
    state.design ?? {
      caption: $('caption').value,
      city: state.city,
      date: state.date,
      effect: state.effect,
      frame: state.frame,
      weatherText: state.weather?.text ?? '',
    }
  );
}
async function renderDesign() {
  const version = ++renderVersion;
  const settings = designSettings();
  let frameImage;
  if (!settings.frame.isPlain) {
    const url = settings.frame.largePhotoFrameUrl ?? settings.frame.frameUrl;
    if (!frameImages.has(url))
      frameImages.set(
        url,
        loadImage(url).catch((error) => {
          frameImages.delete(url);
          throw error;
        }),
      );
    frameImage = await frameImages.get(url);
  }
  if (version !== renderVersion) return false;
  drawPostcard($('postcard'), state.photo, { ...settings, frameImage });
  return true;
}
async function acceptDesign() {
  try {
    state.designLocked = true;
    state.design ??= structuredClone(designSettings());
    $('caption').disabled = true;
    $('retake').disabled = true;
    for (const button of document.querySelectorAll('.choice-list button'))
      button.disabled = true;
    if (!state.outputBlob) {
      await renderDesign();
      state.outputBlob = await jpegBlob($('postcard'));
      state.outputUrl = URL.createObjectURL(state.outputBlob);
      $('final-preview').src = state.outputUrl;
    }
    await active();
    go('delivery');
    updateDelivery();
  } catch (error) {
    if (state.stopped) return;
    client.logError(error, { operation: 'compose' });
    failure(
      'Не удалось подготовить открытку',
      'Повторим подготовку выбранного оформления.',
      acceptDesign,
      'Подготовить ещё раз',
    );
  }
}
function updateDelivery() {
  const digital = state.context.fulfillment === 'digital';
  state.copies = digital ? 0 : Number($('copies').value);
  state.extraAmount = digital
    ? 0
    : extraCost(state.copies, state.context.sheetPrice);
  $('base-price').textContent = money(state.context.price);
  $('extra-price').textContent = money(state.extraAmount);
  $('delivery-description').textContent = digital
    ? 'Сохраним готовую открытку и покажем QR для скачивания.'
    : 'Напечатаем открытку и сохраним цифровую копию для скачивания.';
  $('deliver').textContent = digital
    ? 'Подготовить файл'
    : state.extraAmount > 0
      ? 'Доплатить ' + money(state.extraAmount) + ' и напечатать'
      : 'Напечатать открытку';
  $('delivery-note').textContent = digital
    ? 'Печать и дополнительные списания не требуются.'
    : 'Одна открытка включена в услугу. Дополнительная — ' +
      money(state.context.sheetPrice) +
      '.';
}
async function deliver() {
  $('copies').disabled = true;
  try {
    if (
      state.extraAmount > 0 &&
      operations.get('extra-payment')?.status !== 'done'
    ) {
      try {
        await charge('extra-payment', state.extraAmount);
      } catch (error) {
        if (!state.stopped) paymentFailure(error, 'extra-payment', deliver);
        return;
      }
    }
    await active();
    working('Сохраняем ваш момент.', 'Подготавливаем готовую открытку.');
    const result = await operations.run(
      'upload',
      { photoId: state.shot.photoId },
      (entry) => client.upload(state.outputBlob, entry.requestId),
    );
    state.outputId = result.photoId;
    await active();
    if (state.context.fulfillment === 'print' && !state.printed) {
      working(
        'Печатаем вашу историю.',
        'Дождитесь подтверждения выдачи всех открыток.',
      );
      try {
        await operations.run(
          'print',
          { photoId: state.outputId, copies: state.copies, cut: false },
          (entry) => {
            const options = {
              requestId: entry.requestId,
              timeoutMs: timeout('printMs', 600000),
              onProgress: (job) => {
                $('working-progress').textContent =
                  'Готово открыток: ' + job.copiesDone + ' из ' + job.copies;
                entry.jobId = job.jobId;
              },
            };
            return entry.jobId
              ? client.waitPrint(entry.jobId, options)
              : client.print(entry.args.photoId, entry.args.copies, {
                  ...options,
                  cut: entry.args.cut,
                });
          },
        );
        state.printed = true;
      } catch (error) {
        if (state.stopped) return;
        if (error.code === 'failed' && error.result) {
          failure(
            'Печать остановлена',
            'Подтверждено открыток: ' +
              error.result.copiesDone +
              ' из ' +
              error.result.copies +
              '. Обратитесь к администратору. Повторная печать автоматически не запускается.',
            null,
          );
        } else
          failure(
            'Нужно уточнить результат печати',
            'Продолжим проверку того же задания. Новая печать и повторная оплата не запускаются.',
            deliver,
          );
        return;
      }
    }
    await active();
    working('Добавляем цифровую копию.', 'Готовим ссылку для скачивания.');
    state.shared = await operations.run(
      'share',
      { photoIds: [state.outputId] },
      (entry) =>
        client.share(entry.args.photoIds, {
          requestId: entry.requestId,
          timeoutMs: timeout('commandMs', 15000),
        }),
    );
    await active();
    showShare();
  } catch (error) {
    if (error instanceof ClosedRun || state.stopped) return;
    failure(
      'Не удалось сохранить результат',
      state.printed
        ? 'Печать уже подтверждена. Повторим только сохранение цифровой копии.'
        : 'Продолжим ту же операцию с сохранёнными данными.',
      deliver,
      'Продолжить сохранение',
    );
  }
}
function showShare() {
  go('share');
  $('share-description').textContent = state.printed
    ? 'Ваша открытка напечатана. Сохраните цифровую копию перед завершением.'
    : 'Цифровая открытка готова. Сохраните её перед завершением.';
  const local = new URL(state.shared.downloadUrl, location.href).hostname;
  $('qr-help').textContent = [
    '127.0.0.1',
    'localhost',
    '::1',
    '[::1]',
  ].includes(local)
    ? 'Локальная галерея песочницы работает на этом компьютере. Откройте её в панели «Результаты». Для скачивания на телефон нужна настроенная фотобудка.'
    : 'Наведите камеру телефона на QR-код и сохраните файл.';
  $('share-url').textContent = state.shared.downloadUrl;
  loadQr();
}
function loadQr() {
  $('finish').disabled = true;
  $('reload-qr').hidden = true;
  $('qr-status').textContent = 'Загружаем QR…';
  $('qr').src = state.shared.qrUrl;
}
async function finish() {
  state.closing = 'complete';
  try {
    await operations.run('complete', {}, (entry) =>
      client.complete({ requestId: entry.requestId }),
    );
    state.completionConfirmed = true;
    go('done');
    $('done-title').textContent = 'Пусть хорошее остаётся.';
    $('done-message').textContent =
      'Ваша фотооткрытка готова. Спасибо за этот момент!';
  } catch (error) {
    if (!state.stopped) {
      state.closing = null;
      failure(
        'Завершение не подтверждено',
        'Продолжим тот же запрос завершения. Повтор не запускает оплату или печать.',
        finish,
        'Проверить завершение',
      );
    }
  }
}
function updateRefundAvailability() {
  const paid = [...state.knownPayments.values()].some((amount) => amount > 0);
  $('refund').disabled = !paid || state.stopped;
  $('refund-note').textContent = paid
    ? 'Программа проверит внесённые суммы и уже предоставленный результат. Автоматический возврат не гарантирован.'
    : 'В этом запуске нет подтверждённых данных о внесённых деньгах.';
}
async function refund() {
  if (state.stopped || state.paused) return;
  $('refund').disabled = true;
  state.closing = 'refund';
  try {
    await operations.run('refund', {}, (entry) =>
      client.requestRefund({ requestId: entry.requestId }),
    );
    $('help-dialog').close();
    go('done');
    $('done-title').textContent = 'Запрос проверки передан';
    $('done-message').textContent =
      'Уточните результат возврата у администратора. Принятие запроса не означает возврат денег.';
  } catch (error) {
    if (!state.stopped) {
      state.closing = null;
      client.logError(error, { operation: 'refund' });
      $('refund-note').textContent =
        'Приём запроса не подтверждён. Уточните результат у администратора. Повтор использует тот же запрос.';
      $('refund').disabled = false;
    }
  }
}

// Visitor controls. The application never calls the sandbox control API.
$('begin').addEventListener('click', () => void action(begin));
$('shoot').addEventListener('click', () => void action(shoot));
$('camera').addEventListener('change', () => {
  if (state.busy || operations.get('capture')?.status === 'unknown') {
    $('camera').value = state.camera;
    return;
  }
  state.camera = $('camera').value;
  updatePreview();
});
$('caption').addEventListener('input', () => {
  if (!state.designLocked)
    void renderDesign().catch((error) =>
      client.logError(error, { operation: 'caption-render' }),
    );
});
$('retake').addEventListener('click', () => {
  if (state.designLocked || state.busy || state.paused || state.stopped) return;
  operations.newAttempt('capture');
  state.shot = null;
  state.photo = null;
  go('camera');
});
$('accept-design').addEventListener('click', () => void action(acceptDesign));
$('copies').addEventListener('change', () => {
  if (!state.busy) updateDelivery();
});
$('deliver').addEventListener('click', () => void action(deliver));
$('finish').addEventListener('click', () => void action(finish));
$('extend').addEventListener('click', () => void extend());
$('retry').addEventListener('click', () => {
  const retry = retryAction;
  if (retry)
    void action(async () => {
      clearError();
      await retry();
    });
});
for (const id of ['exit', 'error-exit', 'help-exit'])
  $(id).addEventListener('click', () => {
    if (!state.stopped)
      void client
        .requestExit()
        .catch((error) =>
          client.logError(error, { operation: 'request-exit' }),
        );
  });
$('help').addEventListener('click', () => {
  updateRefundAvailability();
  $('help-dialog').showModal();
});
$('close-help').addEventListener('click', () => $('help-dialog').close());
$('refund').addEventListener('click', () => void refund());
$('reload-qr').addEventListener('click', loadQr);
$('qr').addEventListener('load', () => {
  $('qr-status').textContent = 'QR готов. Сохраните открытку.';
  $('finish').disabled = false;
  $('reload-qr').hidden = true;
});
$('qr').addEventListener('error', () => {
  $('qr-status').textContent = 'QR пока не загрузился. Повторите загрузку.';
  $('reload-qr').hidden = false;
  client.track('postcard.qr.failed');
});
removeLifecycle = window.pbtService?.onLifecycle(lifecycle);
window.addEventListener('pagehide', () => {
  state.stopped = true;
  for (const waiter of waits.splice(0)) waiter.reject(new ClosedRun());
  dispose();
});
diagnosticsTimer = setInterval(
  () =>
    window.pbtSandboxDiagnostics?.reportSdkDropped(client.diagnosticsDropped),
  1000,
);
void initialize();
