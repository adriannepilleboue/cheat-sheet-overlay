/* overlay-widget.js
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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { CSOShortcutsSheetWidget } from './shortcuts-sheet-widget.js';
import { CSOShortcutDialog } from './shortcut-dialog.js';
import { CSOIconButtonWidget } from './icon-button-widget.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { compatibleVertical } from '../compatibility.js';

export const CSOOverlayWidget = GObject.registerClass(
    class GCSOOverlayWidget extends St.BoxLayout {
        _showNewShortcutDialog() {
            const dialog = new CSOShortcutDialog(this._appId);

            dialog.connect('form-filled', (object, appId, description, shortcutString) => {
                if (this._storedData) {
                    const shortcut = shortcutString.split(' ');
                    this._storedData.addShortcut(appId, description, shortcut);
                }
            });

            dialog.open();
        }

        _showEditShortcutDialog(shortcutDescription, shortcutKeysStr) {
            this._editedShortcutDescription = shortcutDescription;
            this._editedShortcutKeysStr = shortcutKeysStr;
            const dialog = new CSOShortcutDialog(this._appId, shortcutDescription, shortcutKeysStr);

            dialog.connect('form-filled', (object, appId, newDescription, newShortcutStr) => {
                if (this._storedData) {
                    const newShortcut = newShortcutStr.split(' ');
                    this._storedData.editShortcut(
                        appId,
                        this._editedShortcutDescription,
                        this._editedShortcutKeysStr.split(' '),
                        newDescription,
                        newShortcut);
                }
            });

            dialog.connect('delete-clicked', (object, appId) => {
                if (this._storedData) {
                    const shortcut = this._editedShortcutKeysStr.split(' ');
                    this._storedData.deleteShortcut(appId, this._editedShortcutDescription, shortcut);
                }
            });

            dialog.open();
        }

        _buildShortcutHeader() {
            const hbox = new St.BoxLayout({
                style_class: 'cso-overlay-title-hbox ',
            });
            this.add_child(hbox);

            hbox.add_child(new St.Label({
                text: _("Shortcuts"),
                x_expand: true,
                x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'cso-subtitle',
            }));

            const addButton = new CSOIconButtonWidget("list-add-symbolic");
            hbox.add_child(addButton);
            addButton.connect('clicked', () => this._showNewShortcutDialog());
        }

        constructor(settings, settingsVisibilityKey, runtimeData, appId, appName, horizontalAlignement) {
            super({
                ...compatibleVertical(),
                style_class: 'popup-menu-content cso-overlay',
            });

            this._settings = settings;
            this._runtimeData = runtimeData;
            this._storedData = null;
            this._sheetTitle = null;
            this._dataUpdatedHandler = null;
            this._isOverlayEnabled = this._settings.get_boolean(settingsVisibilityKey);
            this._isOverlayRequested = false;
            this._shouldBeDisplayed = false;
            this._isChromeAdded = false;
            this._appId = appId;
            this._appName = appName;
            this._horizontalAlignement = horizontalAlignement;

            this.add_constraint(new Clutter.AlignConstraint({
                source: Main.layoutManager.uiGroup,
                align_axis: Clutter.AlignAxis.X_AXIS,
                factor: this._horizontalAlignement
            }));

            this.add_constraint(new Clutter.AlignConstraint({
                source: Main.layoutManager.uiGroup,
                align_axis: Clutter.AlignAxis.Y_AXIS,
                factor: 1.0 // 0.0 shifts it completely to the top
            }));

            // Title
            this._sheetTitle = new St.Label({
                text: this._appName,
                x_expand: true,
                x_align: Clutter.ActorAlign.CENTER,
                style_class: 'cso-title',
            });
            this.add_child(this._sheetTitle);

            this._buildShortcutHeader();

            // Handle connexions
            this._runtimeData.connectObject(
                'overlay-visibility-changed',
                (object, isOverlayRequested) => {
                    this._isOverlayRequested = isOverlayRequested;
                    if (this._isOverlayRequested) {
                        this._updateContent();
                    }
                    this._updateVisibility();
                    return Clutter.EVENT_STOP;
                },
                this);

            this._settings.connectObject('changed::' + settingsVisibilityKey, () => {
                this._isOverlayEnabled = this._settings.get_boolean(settingsVisibilityKey);
                this._updateVisibility();
            }, this);
        }

        _updateContent() {
            this._sheetTitle.text = this._appName;

            if (this._storedData) {
                const appShortcuts = this._storedData.getAppShortcuts(this._appId) ?? [];

                if (this._shortcutsSheet) {
                    this.remove_child(this._shortcutsSheet);
                    this._shortcutsSheet.destroy();
                    this._shortcutsSheet = null;
                }
                this._shortcutsSheet = new CSOShortcutsSheetWidget(appShortcuts);
                this.add_child(this._shortcutsSheet);

                this._shortcutsSheet.connect('shortcut-clicked', (object, description, keys) => {
                    this._showEditShortcutDialog(description, keys);
                });
            }
        }

        _startShowAnimation() {
            const startOpacity = 0;
            const endOpacity = 255;

            const direction = (this._horizontalAlignement * 2.0) - 1.0;
            const startTranslationX = direction * 50.0;
            const endTranslationX = 0.0;

            this.opacity = startOpacity;
            this.translation_x = startTranslationX;

            if (!this._isChromeAdded) {
                Main.layoutManager.addChrome(this, { trackFullscreen: true });
                this._isChromeAdded = true;
            }

            this.ease({
                opacity: endOpacity,
                translation_x: endTranslationX,
                duration: 250,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        }

        _startHideAnimation() {
            const startOpacity = 255;
            const endOpacity = 0;

            const direction = (this._horizontalAlignement * 2.0) - 1.0;
            const startTranslationX = 0.0;
            const endTranslationX = direction * 50.0;

            this.opacity = startOpacity;
            this.translation_x = startTranslationX;

            this.ease({
                opacity: endOpacity,
                translation_x: endTranslationX,
                duration: 250,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    if (this._isChromeAdded) {
                        Main.layoutManager.removeChrome(this);
                        this._isChromeAdded = false;
                    }
                }
            });
        }

        _updateVisibility() {
            const shouldBeDisplayed = (this._isOverlayEnabled && this._appId !== "" && this._isOverlayRequested);
            if (shouldBeDisplayed !== this._shouldBeDisplayed) {
                this._shouldBeDisplayed = shouldBeDisplayed;
                if (this._shouldBeDisplayed) {
                    this._startShowAnimation();
                }
                else {
                    this._startHideAnimation();
                }
            }
        }

        setStoredData(storedData) {
            if (this._storedData && this._dataUpdatedHandler) {
                this._storedData.disconnect(this._dataUpdatedHandler);
                this._dataUpdatedHandler = null;
            }

            this._storedData = storedData;
            if (this._storedData) {
                this._updateContent();
                this._dataUpdatedHandler = this._storedData.connect("data-updated", () => this._updateContent());
            }
        }

        destroy() {
            // Disconnect data-updated signal
            if (this._storedData && this._dataUpdatedHandler) {
                this._storedData.disconnect(this._dataUpdatedHandler);
                this._dataUpdatedHandler = null;
            }

            // Remove overlay
            if (this._isChromeAdded) {
                Main.layoutManager.removeChrome(this);
                this._shouldBeDisplayed = false;
                this._isChromeAdded = false;
            }

            super.destroy();
        }

        setApplicationData(appId, appName) {
            this._appId = appId;
            this._appName = appName;
            this._updateContent();
            this._updateVisibility();
        }
    }
);