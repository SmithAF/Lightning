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

import Utils from './Utils.js'

export default class Base {
  static defaultSetter (obj, name, value) {
    obj[name] = value
  }

  static patchObject (obj, settings) {
    if (!Utils.isObjectLiteral(settings)) {
      console.error('Settings must be object literal')
    } else {
      const names = Object.keys(settings)
      for (let i = 0, n = names.length; i < n; i++) {
        const name = names[i]

        this.patchObjectProperty(obj, name, settings[name])
      }
    }
  }

  static patchObjectProperty (obj, name, value) {
    const setter = obj.setSetting || Base.defaultSetter

    if (name.charAt(0) === '_') {
      // Disallow patching private variables.
      if (name !== '__create') {
        console.error("Patch of private property '" + name + "' is not allowed")
      }
    } else if (name !== 'type') {
      // Type is a reserved keyword to specify the class type on creation.
      if (Utils.isFunction(value) && value.__local) {
        // Local function (Base.local(s => s.something))
        value = value.__local(obj)
      }

      setter(obj, name, value)
    }
  }

  static local (func) {
    // This function can be used as an object setting, which is called with the target object.
    func.__local = true
  }
}
