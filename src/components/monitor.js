/* extension.js
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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';

export const AlignToMonitorConstraint = GObject.registerClass({
    Properties: {
        'settings': GObject.ParamSpec.object(
            'settings', null, null,
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gio.Settings),
        'horizontal-factor': GObject.ParamSpec.float(
            'horizontal-factor', null, null,
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            0.0, 1.0, 0.0),
        'vertical-factor': GObject.ParamSpec.float(
            'vertical-factor', null, null,
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            0.0, 1.0, 0.0),
    },
}, class GAlignToMonitorConstraint extends Clutter.Constraint {
    constructor(props) {
        super(props);

        this._settingsChangedHandle = null;
        this._monitorsChangedHandle = null;
    }

    get settings() {
        return this._settings;
    }

    set settings(v) {
        if (this._settings && this._settingsChangedHandle) {
            this._settings.disconnect('changed::monitor', this._settingsChangedHandle);
        }
        this._settingsChangedHandle = null;

        this._settings = v;

        if (this._settings && this.actor) {
            this._settingsChangedHandle =
                this._settings.connectObject('changed::monitor', () => {
                    this.actor.queue_relayout();
                }, this);
        }
    }

    get horizontal_factor() {
        return this._horizontalFactor;
    }

    set horizontal_factor(v) {
        this._horizontalFactor = v;
        if (this.actor) {
            this.actor.queue_relayout();
        }
    }

    get vertical_factor() {
        return this._verticalFactor;
    }

    set vertical_factor(v) {
        this._verticalFactor = v;
        if (this.actor) {
            this.actor.queue_relayout();
        }
    }

    _set_actor() {
        if (!this._monitorsChangedHandle) {
            this._monitorsChangedHandle =
                Main.layoutManager.connectObject('monitors-changed', () => {
                    this.actor.queue_relayout();
                }, this);
        }

        if (this._settings && !this._settingsChangedHandle) {
            this._settingsChangedHandle =
                this._settings.connectObject('changed::monitor', () => {
                    this.actor.queue_relayout();
                }, this);
        }
    }

    _remove_actor() {
        if (this._monitorsChangedHandle) {
            Main.layoutManager.disconnect(this._monitorsChangedHandle);
        }
        this._monitorsChangedHandle = 0;

        if (this._settings && this._settingsChangedHandle) {
            this._settings.disconnect(this._settingsChangedHandle);
        }
        this._settingsChangedHandle = 0;
    }

    _getMonitor() {
        const monitors = Main.layoutManager.monitors;
        if (monitors.length <= 0) {
            return null;
        }

        const sanitizeIndex = (index, fallback) => {
            const isValid = Number.isInteger(index)
                && index >= 0
                && index < monitors.length
            return isValid ? index : fallback;
        };

        const primaryIndex = global.display.get_primary_monitor();
        let monitorIndex = sanitizeIndex(primaryIndex, 0);

        if (!this.settings) {
            return monitors[0] ?? null;
        }

        const cfgMonitorChoice = this._settings.get_string('monitor');
        if (cfgMonitorChoice === 'focused') {
            const focusWindow = global.display.get_focus_window();
            if (focusWindow) {
                monitorIndex = sanitizeIndex(focusWindow.get_monitor(), monitorIndex);
            }
        }
        else if (cfgMonitorChoice.startsWith('monitor')) {
            // Direct index (monitor0, monitor1, monitor2, monitor3)
            const index = Number.parseInt(cfgMonitorChoice.replace('monitor', ''));
            monitorIndex = sanitizeIndex(index, monitorIndex);
        }
        // else: 'primary'

        return monitors[monitorIndex];
    }

    vfunc_set_actor(actor) {
        this._remove_actor();

        if (actor) {
            this._set_actor();
        }

        super.vfunc_set_actor(actor);
    }

    vfunc_update_allocation(actor, actorBox) {
        const monitor = this._getMonitor();

        const sourceWidth = monitor ? monitor.width : global.stage.width;
        const sourceHeight = monitor ? monitor.height : global.stage.height;
        const sourcePosX = monitor ? monitor.x : 0;
        const sourcePosY = monitor ? monitor.y : 0;

        const [_minWidth, naturalWidth] = actor.get_preferred_width(-1);
        const [_minHeight, naturalHeight] = actor.get_preferred_height(-1);

        actorBox.init_rect(
            sourcePosX + (sourceWidth - naturalWidth) * this._horizontalFactor,
            sourcePosY + (sourceHeight - naturalHeight) * this._verticalFactor,
            naturalWidth,
            naturalHeight
        );
    }
});
