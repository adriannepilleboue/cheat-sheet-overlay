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
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { CSOStoredData } from './components/stored-data.js';
import { CSOIndicatorWidget } from './components/indicator-widget.js';
import { CSOOverlayWidget } from './components/overlay-widget.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class CSOExtension extends Extension {
    _onFocusChanged() {
        if (!this._appOverlay) {
            return;
        }

        let appName = "";
        let appId = "";

        const focusWindow = global.display.get_focus_window();
        if (focusWindow) {
            const tracker = Shell.WindowTracker.get_default();
            const app = tracker.get_window_app(focusWindow);
            appId = app?.get_id() ?? "";
            appName = app?.get_name() ?? "";
        }

        this._appOverlay.setApplicationData(appId, appName);
    }

    enable() {
        this._settings = this.getSettings();
        this._storedData = new CSOStoredData();

        this._systemOverlay = new CSOOverlayWidget("system", _("System"), 0.0);
        this._systemOverlay.setStoredData(this._storedData);

        this._appOverlay = new CSOOverlayWidget("", "", 1.0);
        this._appOverlay.setStoredData(this._storedData);

        this._indicator = new CSOIndicatorWidget(this.metadata);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._indicatorKeybinding = Main.wm.addKeybinding(
            'toggle-overlay',
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                if (this._indicator) {
                    this._indicator.toggleOverlay();
                }
            }
        );

        // Update the app overlay if the focus changed
        this._focusSignal = global.display.connect(
            'notify::focus-window',
            () => this._onFocusChanged());

        this._indicatorVisibilityHandle = this._indicator.connect(
            'overlay-visibility-changed',
            (object, isOverlayRequested) => {
                if (isOverlayRequested) {
                    this._systemOverlay.showOverlay();
                    this._appOverlay.showOverlay();
                }
                else {
                    this._systemOverlay.hideOverlay();
                    this._appOverlay.hideOverlay();
                }
                return Clutter.EVENT_STOP;
            });
    }

    disable() {
        if (this._indicatorKeybinding) {
            Main.wm.removeKeybinding('toggle-overlay');
            this._indicatorKeybinding = null;
        }

        if (this._focusSignal) {
            global.display.disconnect(this._focusSignal);
            this._focusSignal = null;
        }

        if (this._indicatorVisibilityHandle) {
            this._indicator?.disconnect(this._indicatorVisibilityHandle);
            this._indicatorVisibilityHandle = null;
        }

        this._indicator?.destroy();
        this._indicator = null;

        this._appOverlay?.destroy();
        this._appOverlay = null;

        this._systemOverlay?.destroy();
        this._systemOverlay = null;

        this._storedData = null;
        this._settings = null;
    }
}
