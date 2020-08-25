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

import Base from '../tree/Base.js';

export default class Renderer {
  constructor (stage) {
    this.stage = stage;
    this._defaultShader = undefined;
  }

  gc (aggressive) {}

  destroy () {}

  getDefaultShader (ctx = this.stage.ctx) {
    if (!this._defaultShader) {
      this._defaultShader = this._createDefaultShader(ctx);
    }
    return this._defaultShader;
  }

  _createDefaultShader (ctx) {}

  isValidShaderType (shaderType) {
    return shaderType.prototype instanceof this._getShaderBaseType();
  }

  createShader (ctx, settings) {
    const ShaderType = settings.type;
    // If shader type is not correct, use a different platform.
    if (!this.isValidShaderType(ShaderType)) {
      const ConvertedShaderType = this._getShaderAlternative(ShaderType);
      if (!ConvertedShaderType) {
        console.warn('Shader has no implementation for render target: ' + ShaderType.name);
        return this._createDefaultShader(ctx);
      }
      return new ConvertedShaderType(ctx);
    } else {
      const shader = new ShaderType(ctx);
      Base.patchObject(this, settings);
      return shader;
    }
  }

  _getShaderBaseType () {}

  _getShaderAlternative (shaderType) {
    return this.getDefaultShader();
  }

  copyRenderTexture (renderTexture, nativeTexture, options) {
    console.warn('copyRenderTexture not supported by renderer');
  }
}