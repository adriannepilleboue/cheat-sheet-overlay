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

import GObject from 'gi://GObject';

///////////////////////////////////////////////////////////////
export const CSORuntimeData = GObject.registerClass(
    {
        Signals: {
            'overlay-visibility-changed': {
                param_types: [GObject.TYPE_BOOLEAN],
            }
        },
    },
    class GCSORuntimeData extends GObject.Object {
        constructor() {
            super();

            this._isOverlayDisplayed = false;
            this.emit('overlay-visibility-changed', this._isOverlayDisplayed);
        }

        toggleOverlay() {
            this._isOverlayDisplayed = !this._isOverlayDisplayed;
            this.emit('overlay-visibility-changed', this._isOverlayDisplayed);
        }
    }
);