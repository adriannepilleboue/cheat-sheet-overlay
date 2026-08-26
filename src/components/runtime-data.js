/* stored-data.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0
 */

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

///////////////////////////////////////////////////////////////
export const CSORuntimeData = GObject.registerClass(
    {
        Signals: {
            'overlay-visibility-changed': {
                param_types: [GObject.TYPE_BOOLEAN],
            },
            'modifiers-changed': {
                param_types: [],
            },
        }
    },
    class GCSORuntimeData extends GObject.Object {
        constructor() {
            super();

            this._isOverlayDisplayed = false;
            this._modifiersState = 0;
            this._pointerTimeoutHandle = null;

            this.emit('overlay-visibility-changed', this._isOverlayDisplayed);
        }

        destroy() {
            this._stopModifierMonitoring();
            super.destroy();
        }

        //////////////////////////////////////////////////////
        // Overlay
        toggleOverlay() {
            this._isOverlayDisplayed = !this._isOverlayDisplayed;

            if (this._isOverlayDisplayed) {
                this._startModifierMonitoring();
            }
            else {
                this._stopModifierMonitoring();
            }

            this.emit('overlay-visibility-changed', this._isOverlayDisplayed);
        }

        //////////////////////////////////////////////////////
        // Modifiers
        _onNewPointerState(state) {
            const monitoredModifierMask = Clutter.ModifierType.SHIFT_MASK |
                Clutter.ModifierType.CONTROL_MASK |
                Clutter.ModifierType.MOD1_MASK | // Alt
                Clutter.ModifierType.SUPER_MASK | // Super
                Clutter.ModifierType.META_MASK | // Super
                Clutter.ModifierType.HYPER_MASK | // Super
                Clutter.ModifierType.MOD4_MASK; // Super

            const newMonitoredState = state & monitoredModifierMask;
            if (this._modifiersState !== newMonitoredState) {
                this._modifiersState = newMonitoredState;
                this.emit('modifiers-changed');
            }
        }

        _startModifierMonitoring() {
            if (this._pointerTimeoutHandle !== null) {
                return;
            }

            const refreshRateMs = 100;

            this._pointerTimeoutHandle = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                refreshRateMs,
                () => {
                    const [, , state] = global.get_pointer();
                    this._onNewPointerState(state);
                    return GLib.SOURCE_CONTINUE;
                }
            );
        }

        _stopModifierMonitoring() {
            this._modifiersState = 0;
            
            if (this._pointerTimeoutHandle !== null) {
                GLib.Source.remove(this._pointerTimeoutHandle);
                this._pointerTimeoutHandle = null;
            }
        }

        getModifiersState() {
            return this._modifiersState;
        }

        enableLiveModifiers() {
            if (this._isOverlayDisplayed) {
                this._startModifierMonitoring();
            }
        }

        disableLiveModifiers() {
            this._stopModifierMonitoring();

            if (this._isOverlayDisplayed) {
                this.emit('modifiers-changed');
            }
        }
    }
);