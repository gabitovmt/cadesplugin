import 'cadesplugin/cadesplugin_api';
import DigitalSignatureAsyncProvider from "./DigitalSignatureAsyncProvider";
import DigitalSignatureSyncProvider from "./DigitalSignatureSyncProvider";
import DigitalSignatureProvider from "./DigitalSignatureProvider";

/**
 * cadesplugin загружается в глобальную область видимости
 */
declare var cadesplugin: Promise<any>;

/**
 * Пробуем получить cadesplugin
 */
function init(): void {
  const canPromise = (window as any).Promise;
  if (canPromise) {
    cadesplugin.then(
      () => main(),
      e => console.error(e)
    );
  } else {
    window.addEventListener("message", cadespluginMessageListener, false);
    window.postMessage("cadesplugin_echo_request", "*");
  }
}

/**
 * Если браузер не поддерживает Promise, то вынуждены получить синхронную версию cadesplugin
 */
function cadespluginMessageListener(event: MessageEvent<any>) {
  if (event.data === 'cadesplugin_loaded') {
    main();
    window.removeEventListener('message', cadespluginMessageListener);
  } else if (event.data === 'cadesplugin_load_error') {
    console.error('Cannot load plugin.');
    window.removeEventListener('message', cadespluginMessageListener);
  }
}

/**
 * Получить асинхронную версию cadesplugin, если он поддерживается
 *
 * @param cadesplugin
 */
function canAsync(cadesplugin: CADESPlugin): cadesplugin is CADESPluginAsync {
  return !!(cadesplugin as CADESPluginAsync).CreateObjectAsync;
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

document.addEventListener('DOMContentLoaded', () => {
  init();
});
