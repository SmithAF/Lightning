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

import Application from './application/Application.js';
import Component from './application/Component.js';
import Base from './tree/Base.js';
import Utils from './tree/Utils.js';
import StageUtils from './tree/StageUtils.js';
import Element from './tree/Element.js';
import ElementCore from './tree/core/ElementCore.js';
import ElementTexturizer from './tree/core/ElementTexturizer.js';
import Texture from './tree/Texture.js';

import Tools from './tools/Tools.js';
import ObjMerger from './tools/ObjMerger.js';
import ObjectListProxy from './tools/ObjectListProxy.js';
import ObjectListWrapper from './tools/ObjectListWrapper.js';

import RectangleTexture from './textures/RectangleTexture.js';
import NoiseTexture from './textures/NoiseTexture.js';
import TextTexture from './textures/TextTexture.js';
import ImageTexture from './textures/ImageTexture.js';
import HtmlTexture from './textures/HtmlTexture.js';
import StaticTexture from './textures/StaticTexture.js';
import StaticCanvasTexture from './textures/StaticCanvasTexture.js';
import SourceTexture from './textures/SourceTexture.js';

import ListComponent from './components/ListComponent.js';
import FastBlurComponent from './components/FastBlurComponent.js';
import BloomComponent from './components/BloomComponent.js';
import SmoothScaleComponent from './components/SmoothScaleComponent.js';
import BorderComponent from './components/BorderComponent.js';
import EventEmitter from './EventEmitter.js';

import WebGLShader from './renderer/webgl/WebGLShader.js';
import WebGLDefaultShader from './renderer/webgl/shaders/DefaultShader.js';
import { WebGLGrayscaleShader, C2dGrayscaleShader } from './renderer/common/shaders/GrayscaleShader.js';
import BoxBlurShader from './renderer/webgl/shaders/BoxBlurShader.js';
import DitheringShader from './renderer/webgl/shaders/DitheringShader.js';
import CircularPushShader from './renderer/webgl/shaders/CircularPushShader.js';
import InversionShader from './renderer/webgl/shaders/InversionShader.js';
import LinearBlurShader from './renderer/webgl/shaders/LinearBlurShader.js';
import OutlineShader from './renderer/webgl/shaders/OutlineShader.js';
import PixelateShader from './renderer/webgl/shaders/PixelateShader.js';
import RadialFilterShader from './renderer/webgl/shaders/RadialFilterShader.js';
import RoundedRectangleShader from './renderer/webgl/shaders/RoundedRectangleShader.js';
import VignetteShader from './renderer/webgl/shaders/VignetteShader.js';
import SpinnerShader from './renderer/webgl/shaders/SpinnerShader.js';
import HoleShader from './renderer/webgl/shaders/HoleShader.js';
import RadialGradientShader from './renderer/webgl/shaders/RadialGradientShader.js';
import Light3dShader from './renderer/webgl/shaders/Light3dShader.js';
import PerspectiveShader from './renderer/webgl/shaders/PerspectiveShader.js';

import C2dShader from './renderer/c2d/C2dShader.js';
import C2dDefaultShader from './renderer/c2d/shaders/DefaultShader.js';

import C2dBlurShader from './renderer/c2d/shaders/BlurShader.js';

import Stage from './tree/Stage.js';
const lightning = {
  Application,
  Component,
  Base,
  Utils,
  StageUtils,
  Element,
  Tools,
  Stage,
  ElementCore,
  ElementTexturizer,
  Texture,
  EventEmitter,
  shaders: {
    Grayscale: WebGLGrayscaleShader,
    BoxBlur: BoxBlurShader,
    Dithering: DitheringShader,
    CircularPush: CircularPushShader,
    Inversion: InversionShader,
    LinearBlur: LinearBlurShader,
    Outline: OutlineShader,
    Pixelate: PixelateShader,
    RadialFilter: RadialFilterShader,
    RoundedRectangle: RoundedRectangleShader,
    Hole: HoleShader,
    Vignette: VignetteShader,
    Spinner: SpinnerShader,
    RadialGradient: RadialGradientShader,
    Light3d: Light3dShader,
    Perspective: PerspectiveShader,
    WebGLShader,
    WebGLDefaultShader,
    C2dShader,
    C2dDefaultShader,
    c2d: {
      Grayscale: C2dGrayscaleShader,
      Blur: C2dBlurShader
    }
  },
  textures: {
    RectangleTexture,
    NoiseTexture,
    TextTexture,
    ImageTexture,
    HtmlTexture,
    StaticTexture,
    StaticCanvasTexture,
    SourceTexture
  },
  components: {
    FastBlurComponent,
    BloomComponent,
    SmoothScaleComponent,
    BorderComponent,
    ListComponent
  },
  tools: {
    ObjMerger,
    ObjectListProxy,
    ObjectListWrapper
  }
};

if (Utils.isWeb) {
  window.lng = lightning;
}

export default lightning;
