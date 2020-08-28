import ImageWorker from './ImageWorker';
import { REDImageWorkerContainer } from './REDImageWorkerContainer';

export class REDImageWorker extends ImageWorker {
  _initWorker() {
    const code = `(${REDImageWorkerContainer.toString()})()`;
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
}
