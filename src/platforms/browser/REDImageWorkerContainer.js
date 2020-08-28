/* eslint-disable no-unused-vars */
export const REDImageWorkerContainer = () => {
  /**
   * Builds a numeric code for a given fourCC string
   * @param {string} value format identifier
   */
  const fourCCToInt32 = (value) =>
    value.charCodeAt(0) + (value.charCodeAt(1) << 8) + (value.charCodeAt(2) << 16) + (value.charCodeAt(3) << 24);

  /**
   * Turns a fourCC numeric code into a string
   * @param {string} value format identifier
   */
  const int32ToFourCC = (value) =>
    String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);

  // PVR formats, from:
  // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
  const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8c00;
  const COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8c01;
  const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8c02;
  const COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8c03;

  // ETC1 format, from:
  // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
  const COMPRESSED_RGB_ETC1_WEBGL = 0x8d64;

  const PVR_FORMAT_2BPP_RGB = 0;
  const PVR_FORMAT_2BPP_RGBA = 1;
  const PVR_FORMAT_4BPP_RGB = 2;
  const PVR_FORMAT_4BPP_RGBA = 3;
  const PVR_FORMAT_ETC1 = 6;
  const PVR_FORMAT_DXT1 = 7;
  const PVR_FORMAT_DXT3 = 9;
  const PVR_FORMAT_DXT5 = 5;

  const PVR_HEADER_LENGTH = 13; // The header length in 32 bit ints.
  const PVR_MAGIC = 0x03525650; // 0x50565203;

  // Offsets into the header array.
  const PVR_HEADER_MAGIC = 0;
  const PVR_HEADER_FORMAT = 2;
  const PVR_HEADER_HEIGHT = 6;
  const PVR_HEADER_WIDTH = 7;
  const PVR_HEADER_MIPMAPCOUNT = 11;
  const PVR_HEADER_METADATA = 12;

  // header is 16 bytes long
  const PKM_HEADER_LENGTH = 16;

  // DXT formats, from:
  // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
  const COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0;
  const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83f1;
  const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83f2;
  const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83f3;

  // ATC formats, from:
  // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_atc/
  const COMPRESSED_RGB_ATC_WEBGL = 0x8c92;
  const COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8c93;
  const COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87ee;

  // DXT values and structures referenced from:
  // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
  const DDS_MAGIC = 0x20534444;
  const DDSD_MIPMAPCOUNT = 0x20000;
  const DDPF_FOURCC = 0x4;

  const DDS_HEADER_LENGTH = 31; // The header length in 32 bit ints.

  // Offsets into the header array.
  const DDS_HEADER_MAGIC = 0;

  const DDS_HEADER_SIZE = 1;
  const DDS_HEADER_FLAGS = 2;
  const DDS_HEADER_HEIGHT = 3;
  const DDS_HEADER_WIDTH = 4;

  const DDS_HEADER_MIPMAPCOUNT = 7;

  const DDS_HEADER_PF_FLAGS = 20;
  const DDS_HEADER_PF_FOURCC = 21;

  // FourCC format identifiers.
  const FOURCC_DXT1 = fourCCToInt32('DXT1');
  const FOURCC_DXT3 = fourCCToInt32('DXT3');
  const FOURCC_DXT5 = fourCCToInt32('DXT5');

  const FOURCC_ATC = fourCCToInt32('ATC ');
  const FOURCC_ATCA = fourCCToInt32('ATCA');
  const FOURCC_ATCI = fourCCToInt32('ATCI');
  const FOURCC_PKM = fourCCToInt32('PKM ');

  // Parse a PVR file and provide information about the raw texture data it contains to the given callback.

  class ImageWorkerServerItem {
    constructor(id, src) {
      this._onError = undefined;
      this._onFinish = undefined;
      /**
       * @type {string}
       */
      this._id = id;
      /**
       * @type {string}
       */
      this._src = src;
      /**
       * @type {XMLHttpRequest}
       */
      this._xhr = undefined;
      /**
       * @type {string}
       */
      this._mimeType = undefined;
      /**
       * @type {boolean}
       */
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
      this._xhr.onerror = (oEvent) => this.error({ type: 'connection', message: 'Connection error' });
      this._xhr.onload = (oEvent) => {
        const blob = this._xhr.response;
        this._mimeType = blob.type;

        this._mimeType.includes('octet-stream') ? this._loadTexture(blob) : this._createImageBitmap(blob);
      };

      this._xhr.send();
    }

    /**
     * Parse a DDS file and provide information about the raw DXT data it contains
     * @param {ArrayBuffer} blob texture binary
     */
    processDDS(buffer) {
      // Get a view of the arrayBuffer that represents the DDS header.
      const header = new Int32Array(buffer, 0, DDS_HEADER_LENGTH);

      // Do some sanity checks to make sure this is a valid DDS file.
      if (header[DDS_HEADER_MAGIC] != DDS_MAGIC) throw new Error('Invalid magic number in DDS header');

      // errorCallback('Unsupported format, must contain a FourCC code');
      if (!header[DDS_HEADER_PF_FLAGS] & DDPF_FOURCC) throw new Error('Unsupported DDS format');
      // Determine what type of compressed data the file contains.
      const fourCC = header[DDS_HEADER_PF_FOURCC];

      const format = { code: 0, name: '' };
      switch (fourCC) {
        case FOURCC_DXT1:
          format.code = COMPRESSED_RGB_S3TC_DXT1_EXT;
          format.name = 'COMPRESSED_RGB_S3TC_DXT1_EXT';
          break;

        case FOURCC_DXT3:
          format.code = COMPRESSED_RGBA_S3TC_DXT3_EXT;
          format.name = 'COMPRESSED_RGBA_S3TC_DXT3_EXT';
          break;

        case FOURCC_DXT5:
          format.code = COMPRESSED_RGBA_S3TC_DXT5_EXT;
          format.name = 'COMPRESSED_RGBA_S3TC_DXT5_EXT';
          break;

        case FOURCC_ATC:
          format.code = COMPRESSED_RGB_ATC_WEBGL;
          format.name = 'COMPRESSED_RGB_ATC_WEBGL';
          break;

        case FOURCC_ATCA:
          format.code = COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL;
          format.name = 'COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL';
          break;

        case FOURCC_ATCI:
          format.code = COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
          format.name = 'COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL';
          break;

        default:
          throw new Error('Unsupported FourCC code: ' + int32ToFourCC(fourCC));
      }

      // Determine how many mipmap levels the file contains.
      const levels = header[DDS_HEADER_FLAGS] & DDSD_MIPMAPCOUNT ? Math.max(1, header[DDS_HEADER_MIPMAPCOUNT]) : 1;
      // Gather other basic metrics and a view of the raw data.
      const dataOffset = header[DDS_HEADER_SIZE] + 4;
      const textureBuffer = new Uint8Array(buffer, dataOffset);
      return {
        format,
        levels,
        width: header[DDS_HEADER_WIDTH],
        height: header[DDS_HEADER_HEIGHT],
        buffer: textureBuffer,
        /**
         * @TODO
         * Currently required to set these for it to be passed along to where we can upload the texture.
         * In the future I would like to change this
         */
        hasAlphaChannel: false,
        imageBitmap: textureBuffer
      };
    }

    /**
     *
     * @param {ArrayBuffer} buffer texture binary
     */
    processPVR(buffer) {
      // Get a view of the arrayBuffer that represents the DDS header.
      const header = new Int32Array(buffer, 0, PVR_HEADER_LENGTH);

      // Do some sanity checks to make sure this is a valid DDS file.
      if (header[PVR_HEADER_MAGIC] !== PVR_MAGIC) throw new Error('Invalid magic number in PVR header');

      // Determine what type of compressed data the file contains.
      const textureFormat = header[PVR_HEADER_FORMAT];

      const format = { code: 0, name: '' };
      switch (textureFormat) {
        case PVR_FORMAT_2BPP_RGB:
          format.code = COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
          format.name = 'COMPRESSED_RGB_PVRTC_2BPPV1_IMG';
          break;

        case PVR_FORMAT_2BPP_RGBA:
          format.code = COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
          format.name = 'COMPRESSED_RGBA_PVRTC_2BPPV1_IMG';
          break;

        case PVR_FORMAT_4BPP_RGB:
          format.code = COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
          format.name = 'COMPRESSED_RGB_PVRTC_4BPPV1_IMG';
          break;

        case PVR_FORMAT_4BPP_RGBA:
          format.code = COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
          format.name = 'COMPRESSED_RGBA_PVRTC_4BPPV1_IMG';
          break;

        case PVR_FORMAT_ETC1:
          format.code = COMPRESSED_RGB_ETC1_WEBGL;
          format.name = 'COMPRESSED_RGB_ETC1_WEBGL';
          break;

        case PVR_FORMAT_DXT1:
          format.code = COMPRESSED_RGB_S3TC_DXT1_EXT;
          format.name = 'COMPRESSED_RGB_S3TC_DXT1_EXT';
          break;

        case PVR_FORMAT_DXT3:
          format.code = COMPRESSED_RGBA_S3TC_DXT3_EXT;
          format.name = 'COMPRESSED_RGBA_S3TC_DXT3_EXT';
          break;

        case PVR_FORMAT_DXT5:
          format.code = COMPRESSED_RGBA_S3TC_DXT5_EXT;
          format.name = 'COMPRESSED_RGBA_S3TC_DXT5_EXT';
          break;

        default:
          throw new Error(`Unsupported PVR format: ${format}`);
      }

      // Gather other basic metrics and a view of the raw the DXT data.

      const levels = header[PVR_HEADER_MIPMAPCOUNT];
      const dataOffset = header[PVR_HEADER_METADATA] + 52;
      const textureBuffer = new Uint8Array(buffer, dataOffset);
      return {
        format,
        levels,
        width: header[PVR_HEADER_WIDTH],
        height: header[PVR_HEADER_HEIGHT],
        buffer: textureBuffer,
        /**
         * @TODO
         * Currently required to set these for it to be passed along to where we can upload the texture.
         * In the future I would like to change this
         */
        hasAlphaChannel: false,
        imageBitmap: textureBuffer
      };
    }

    /**
     *
     * @param {ArrayBuffer} buffer texture buffer
     */
    processPKM(buffer) {
      const dataView = new DataView(buffer);
      if (FOURCC_PKM !== dataView.getUint32(0, true)) throw new Error('Invalid PKM file');
      const textureBuffer = new Uint8Array(buffer, PKM_HEADER_LENGTH);
      return {
        format: {
          code: COMPRESSED_RGB_ETC1_WEBGL,
          name: 'COMPRESSED_RGB_ETC1_WEBGL'
        },
        levels: 1,
        width: dataView.getUint16(8),
        height: dataView.getUint16(10),
        buffer: textureBuffer,
        /**
         * @TODO
         * Currently required to set these for it to be passed along to where we can upload the texture.
         * In the future I would like to change this
         */
        hasAlphaChannel: false,
        imageBitmap: textureBuffer
      };
    }

    /**
     * @param {Blob} blob of texture data
     */
    _loadTexture(blob) {
      const ext = (/(?:\.([^.]+))?$/.exec(this._src)[1] || '').toLowerCase();

      blob
        .arrayBuffer()
        .then((buffer) => {
          switch (ext) {
            case 'dds':
              return this.processDDS(buffer);
            case 'pvr':
              return this.processPVR(buffer);
            case 'pkm':
              return this.processPKM(buffer);
          }
        })
        .then((data) => {
          if (!data) throw new Error('No data was provided');

          this.finish(data, data.buffer);
        });
    }

    _createImageBitmap(blob) {
      const t = this;
      createImageBitmap(blob, {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        imageOrientation: 'none'
      })
        .then(function (imageBitmap) {
          t.finish(
            {
              imageBitmap,
              hasAlphaChannel: t._hasAlphaChannel()
            },
            imageBitmap
          );
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

    finish(item, info, ...transfer) {
      postMessage(
        {
          type: 'data',
          id: item.id,
          info
        },
        transfer
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
