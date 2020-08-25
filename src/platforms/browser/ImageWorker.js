/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 RDK Management
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ImageWorkerContainer } from './ImageWorkerContainer';
export default class ImageWorker {
  constructor(options = {}) {
    this._items = new Map();
    this._id = 0;

    this._initWorker();
  }

  destroy() {
    if (this._worker) {
      this._worker.terminate();
    }
  }

  _initWorker() {
    const code = `(${ImageWorkerContainer.toString()})()`;
    const blob = new Blob([code.replace('"use strict";', '')]); // firefox adds "use strict"; to any function which might block worker execution so knock it off
    const blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob, {
      type: 'application/javascript; charset=utf-8'
    });
    this._worker = new Worker(blobURL);

    this._worker.postMessage({
      type: 'config',
      config: { path: window.location.href, protocol: window.location.protocol }
    });

    this._worker.onmessage = (e) => {
      if (e.data && e.data.id) {
        const id = e.data.id;
        const item = this._items.get(id);
        if (item) {
          if (e.data.type == 'data') {
            this.finish(item, e.data.info);
          } else {
            this.error(item, e.data.info);
          }
        }
      }
    };
  }

  create(src) {
    const id = ++this._id;
    const item = new ImageWorkerImage(this, id, src);
    this._items.set(id, item);
    this._worker.postMessage({ type: 'add', id: id, src: src });
    return item;
  }

  cancel(image) {
    this._worker.postMessage({ type: 'cancel', id: image.id });
    this._items.delete(image.id);
  }

  error(image, info) {
    image.error(info);
    this._items.delete(image.id);
  }

  finish(image, info) {
    image.load(info);
    this._items.delete(image.id);
  }
}

class ImageWorkerImage {
  constructor(manager, id, src) {
    this._manager = manager;
    this._id = id;
    this._src = src;
    this._onError = null;
    this._onLoad = null;
  }

  get id() {
    return this._id;
  }

  get src() {
    return this._src;
  }

  set onError(f) {
    this._onError = f;
  }

  set onLoad(f) {
    this._onLoad = f;
  }

  cancel() {
    this._manager.cancel(this);
  }

  load(info) {
    if (this._onLoad) {
      this._onLoad(info);
    }
  }

  error(info) {
    if (this._onError) {
      this._onError(info);
    }
  }
}
