/* eslint-disable no-undef */

import 'cadesplugin/cadesplugin_api';
import DigitalSignatureAsyncProvider from './DigitalSignatureAsyncProvider';
import DigitalSignatureSyncProvider from './DigitalSignatureSyncProvider';
import DigitalSignatureProvider from './DigitalSignatureProvider';
import RuError from '../utils/RuError';

/**
 * cadesplugin загружается в глобальную область видимости
 */
declare let cadesplugin: Promise<any>;

/**
 * Пробуем получить cadesplugin
 */
function init(): void {
  const canPromise = (window as any).Promise;
  if (canPromise) {
    cadesplugin.then(
      () => main(),
      (e) => { throw e; },
    );
  } else {
    window.addEventListener('message', cadesPluginMessageListener, false);
    window.postMessage('cadesplugin_echo_request', '*');
  }
}

/**
 * Если браузер не поддерживает Promise, то вынуждены получить синхронную версию cadesplugin
 */
function cadesPluginMessageListener(event: MessageEvent) {
  if (event.data === 'cadesplugin_loaded') {
    main();
    window.removeEventListener('message', cadesPluginMessageListener);
  } else if (event.data === 'cadesplugin_load_error') {
    window.removeEventListener('message', cadesPluginMessageListener);
    throw RuError.new(
      'Cannot load plugin',
      'Не удалось подключиться к CryptoPro Extension for CAdES Browser plug-in',
    );
  }
}

/**
 * Получить асинхронную версию cadesplugin, если он поддерживается
 */
function canAsync(cadesPlugin: CADESPlugin): cadesPlugin is CADESPluginAsync {
  return !!(cadesPlugin as CADESPluginAsync).CreateObjectAsync;
}

/**
 * В зависимости от браузера и плагина КриптоПро ЭЦП Browser plug-in
 * загружается синхронная или асинхронная версия cadesplugin.
 * В зависимости от версии cadusplugin создаём нужную версию провайдера ЭЦП
 */
function main() {
  DigitalSignatureProvider.instance = canAsync(cadesplugin as CADESPlugin)
    ? new DigitalSignatureAsyncProvider(cadesplugin as CADESPluginAsync)
    : new DigitalSignatureSyncProvider(cadesplugin as CADESPluginSync);
}

init();
