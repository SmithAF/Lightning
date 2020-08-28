import { REDImageWorker } from './REDImageWorker';
import WebPlatform from './WebPlatform';

// ETC1 format, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
const COMPRESSED_RGB_ETC1_WEBGL = 0x8d64;
// ATC formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_atc/
const COMPRESSED_RGB_ATC_WEBGL = 0x8c92;
const COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8c93;
const COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87ee;

// DXT formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
const COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0;
const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83f1;
const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83f2;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83f3;
// PVR formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8c00;
const COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8c01;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8c02;
const COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8c03;

export class REDPlatform extends WebPlatform {
  /**
   * Gets the specified extension if available and tests for vendor prefixes
   * @param {WebGLRenderingContext} gl rendering context
   * @param {string} name of extension
   */
  getExtension(gl, name) {
    const vendorPrefixes = ['', 'WEBKIT_', 'MOZ_'];
    let ext = null;
    for (const i in vendorPrefixes) {
      ext = gl.getExtension(`${vendorPrefixes[i]}${name}`);
      if (ext) {
        break;
      }
    }
    return ext;
  }

  init(stage) {
    this.stage = stage;
    this._looping = false;
    this._awaitingLoop = false;

    if (this.stage.getOption('useImageWorker')) {
      if (!window.createImageBitmap || !window.Worker) {
        console.warn("Can't use image worker because browser does not have createImageBitmap and Web Worker support");
      } else {
        console.log('Using image worker!');
        this._imageWorker = new REDImageWorker();
      }
    }
  }

  /**
   * Calcualates the size of a compressed texture level in bytes
   * @param {number} format texture format
   * @param {number} width width of texture
   * @param {number} height height of texture
   */
  textureLevelSize(format, width, height) {
    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGB_ETC1_WEBGL:
        return ((width + 3) >> 2) * ((height + 3) >> 2) * 8;

      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return ((width + 3) >> 2) * ((height + 3) >> 2) * 16;

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
        return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return Math.floor((Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8);

      default:
        return 0;
    }
  }

  /**
   *
   * @param {number} w
   * @param {number} h
   */
  createWebGLContext(w, h) {
    const gl = super.createWebGLContext(w, h);

    this.dxtExt = this.getExtension(gl, 'WEBGL_compressed_texture_s3tc');
    this.pvrtcExt = this.getExtension(gl, 'WEBGL_compressed_texture_pvrtc');
    this.atcExt = this.getExtension(gl, 'WEBGL_compressed_texture_atc');
    this.etc1Ext = this.getExtension(gl, 'WEBGL_compressed_texture_etc1');

    return gl;
  }

  /**
   *
   * @todo Most of this is not required. The only thing I changed was add more data to the onLoad callback
   * It would be nice if in the future to change this to make it more focused to what we want
   *
   * @param {WebGLRenderingContext} gl unknown
   * @param {object} textureSource unknown
   * @param {ArrayBuffer} source unknown
   * @param {object} options unknown
   */
  uploadGlTexture(gl, textureSource, source, options) {
    if (!textureSource.renderInfo || !textureSource.renderInfo.format) {
      super.uploadGlTexture(gl, textureSource, source, options);
      return;
    }

    const { width, height, format } = textureSource.renderInfo;

    // Get a size of the level / mipmap version of the texture
    const levelSize = this.textureLevelSize(format.code, width, height);
    // create new buffer with the provided offset and length based on the texture
    const texture = new Uint8Array(source.buffer, source.byteOffset, levelSize, source);

    // upload version of texture
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, format.code, width, height, 0, texture);
  }

  loadSrcTexture({ src, hasAlpha }, cb) {
    let cancelCb;
    const isPng = src.indexOf('.png') >= 0 || src.substr(0, 21) == 'data:image/png;base64';
    if (this._imageWorker) {
      // WPE-specific image parser.
      const image = this._imageWorker.create(src);
      image.onError = function (err) {
        return cb('Image load error');
      };
      image.onLoad = function (data) {
        cb(null, {
          w: data.width,
          h: data.height,
          source: data.imageBitmap,
          renderInfo: { src: src, ...data },
          hasAlpha: data.hasAlphaChannel,
          premultiplyAlpha: true
        });
      };
      cancelCb = function () {
        image.cancel();
      };
    } else {
      const image = new Image();
      if (!(src.substr(0, 5) == 'data:')) {
        // Base64.
        image.crossOrigin = 'Anonymous';
      }
      image.onerror = function (err) {
        // Ignore error message when cancelled.
        if (image.src) {
          return cb('Image load error');
        }
      };
      image.onload = function () {
        cb(null, {
          source: image,
          renderInfo: { src: src },
          hasAlpha: isPng || hasAlpha
        });
      };
      image.src = src;

      cancelCb = function () {
        image.onerror = null;
        image.onload = null;
        image.removeAttribute('src');
      };
    }

    return cancelCb;
  }
}
