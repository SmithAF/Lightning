/**
 * Notice that, within the createWorker function, we must only use ES5 code to keep it ES5-valid after babelifying, as
 *  the converted code of this section is converted to a blob and used as the js of the web worker thread.
 */

export const ImageWorkerContainer = () => {
  class ImageWorkerServerItem {
    constructor(id, src) {
      this._onError = undefined;
      this._onFinish = undefined;
      this._id = id;
      this._src = src;
      this._xhr = undefined;
      this._mimeType = undefined;
      this._canceled = false;
    }

    get id() {
      return this._id;
    }

    get onFinish() {
      return this._onFinish;
    }

    set onFinish(f) {
      this._onFinish = f;
    }

    get onError() {
      return this._onError;
    }

    set onError(f) {
      this._onError = f;
    }

    start() {
      this._xhr = new XMLHttpRequest();
      this._xhr.open('GET', this._src, true);
      this._xhr.responseType = 'blob';

      const t = this;
      this._xhr.onerror = function (oEvent) {
        t.error({ type: 'connection', message: 'Connection error' });
      };

      this._xhr.onload = function (oEvent) {
        const blob = t._xhr.response;
        t._mimeType = blob.type;

        t._createImageBitmap(blob);
      };

      this._xhr.send();
    }

    _createImageBitmap(blob) {
      const t = this;
      createImageBitmap(blob, {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        imageOrientation: 'none'
      })
        .then(function (imageBitmap) {
          t.finish({
            imageBitmap,
            hasAlphaChannel: t._hasAlphaChannel()
          });
        })
        .catch(function (e) {
          t.error({ type: 'parse', message: 'Error parsing image data' });
        });
    }

    _hasAlphaChannel() {
      if (ImageWorkerServer.isWPEBrowser()) {
        // When using unaccelerated rendering image (https://github.com/WebPlatformForEmbedded/WPEWebKit/blob/wpe-20170728/Source/WebCore/html/ImageBitmap.cpp#L52),
        // everything including JPG images are in RGBA format. Upload is way faster when using an alpha channel.
        // @todo: after hardware acceleration is fixed and re-enabled, JPG should be uploaded in RGB to get the best possible performance and memory usage.
        return true;
      } else {
        return this._mimeType.indexOf('image/png') !== -1;
      }
    }

    cancel() {
      if (this._canceled) return;
      if (this._xhr) {
        this._xhr.abort();
      }
      this._canceled = true;
    }

    error(type, message) {
      if (!this._canceled && this._onError) {
        this._onError({ type, message });
      }
    }

    finish(info) {
      if (!this._canceled && this._onFinish) {
        this._onFinish(info);
      }
    }
  }

  class ImageWorkerServer {
    constructor() {
      this.items = new Map();

      const t = this;
      onmessage = function (e) {
        t._receiveMessage(e);
      };
    }

    static isPathAbsolute(path) {
      return /^(?:\/|[a-z]+:\/\/)/.test(path) || path.substr(0, 5) == 'data:';
    }

    _receiveMessage(e) {
      if (e.data.type === 'config') {
        this.config = e.data.config;

        const base = this.config.path;
        const parts = base.split('/');
        parts.pop();
        this._relativeBase = parts.join('/') + '/';
      } else if (e.data.type === 'add') {
        this.add(e.data.id, e.data.src);
      } else if (e.data.type === 'cancel') {
        this.cancel(e.data.id);
      }
    }

    add(id, src) {
      // Convert relative URLs.
      if (!ImageWorkerServer.isPathAbsolute(src)) {
        src = this._relativeBase + src;
      }

      if (src.substr(0, 2) === '//') {
        // This doesn't work for image workers.
        src = this.config.protocol + src;
      }

      const item = new ImageWorkerServerItem(id, src);
      const t = this;
      item.onFinish = function (result) {
        t.finish(item, result);
      };
      item.onError = function (info) {
        t.error(item, info);
      };
      this.items.set(id, item);
      item.start();
    }

    cancel(id) {
      const item = this.items.get(id);
      if (item) {
        item.cancel();
        this.items.delete(id);
      }
    }

    finish(item, { imageBitmap, hasAlphaChannel }) {
      postMessage(
        {
          type: 'data',
          id: item.id,
          info: {
            imageBitmap,
            hasAlphaChannel
          }
        },
        [imageBitmap]
      );
      this.items.delete(item.id);
    }

    error(item, { type, message }) {
      postMessage({
        type: 'error',
        id: item.id,
        info: {
          type,
          message
        }
      });
      this.items.delete(item.id);
    }

    static isWPEBrowser() {
      return navigator.userAgent.indexOf('WPE') !== -1;
    }
  }
  // eslint-disable-next-line no-new
  new ImageWorkerServer();
};
