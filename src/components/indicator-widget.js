/* indicator-widget.js
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
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

///////////////////////////////////////////////////////////////
export const CSOIndicatorWidget = GObject.registerClass(
    class GCSOIndicatorWidget extends PanelMenu.Button {
        constructor(metadata, runtimeData) {
            super(
                0.0,
                metadata.name,
                true // Don't create menu, we will do it as an overlay manually
            );

            this._runtimeData = runtimeData;
            this._isOverlayRequested = false;

            // Button / Box / Icon
            const icon = new St.Icon({
                icon_name: 'system-help-symbolic',
                style_class: 'system-status-icon',
            });
            this.add_child(icon);

            this.connect('button-press-event', () => {
                this._runtimeData.toggleOverlay();
                return Clutter.EVENT_STOP;
            });
        }
    }
);