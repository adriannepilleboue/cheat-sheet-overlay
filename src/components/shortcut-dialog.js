/* shortcut-dialog.js
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
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { compatibleVertical } from '../compatibility.js';

///////////////////////////////////////////////////////////////
export const CSOShortcutDialog = GObject.registerClass(
    {
        Signals: {
            'form-filled': {
                param_types: [
                    GObject.TYPE_STRING,  // appID
                    GObject.TYPE_STRING,  // description
                    GObject.TYPE_STRING   // shortcut
                ],
            },
            'delete-clicked': {
                param_types: [
                    GObject.TYPE_STRING  // appID
                ],
            },
        },
    },
    class GCSOShortcutDialog extends ModalDialog.ModalDialog {
        constructor(appId, shortcutDescription, shortcutKeysStr) {
            super({
                styleClass: 'popup-menu-content cso-shortcut-dialog',
                destroyOnClose: true, // Automatically cleans up memory when closed
            });

            // On GNOME 46/48, the dialog trigger a new focus event with appId = ''.
            // In all case, it's better to ensure that we save the shortcuts in the
            // correct application
            this._appId = appId;

            const isInEditMode = shortcutDescription || shortcutKeysStr;

            const vbox = new St.BoxLayout({
                ...compatibleVertical(),
                style_class: 'cso-shortcut-dialog-vbox'
            });
            this.contentLayout.add_child(vbox);

            // Title
            vbox.add_child(new St.Label({
                text: isInEditMode ? _("Edit pinned shortcut") : _("Pin new shortcut"),
                style_class: "cso-title",
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER,
            }));

            // Description field
            vbox.add_child(new St.Label({
                text: _("Description"),
                y_align: Clutter.ActorAlign.CENTER,
            }));

            const descriptionEntry = new St.Entry({
                can_focus: true,
                x_expand: true,
                text: shortcutDescription || "",
            });
            vbox.add_child(descriptionEntry);

            // Shortcut field
            vbox.add_child(new St.Label({
                text: _("Shortcut (keys separated by spaces)"),
                y_align: Clutter.ActorAlign.CENTER,
            }));

            const shortcutEntry = new St.Entry({
                can_focus: true,
                x_expand: true,
                text: shortcutKeysStr || "",
            });
            vbox.add_child(shortcutEntry);

            // Buttons
            this.addButton({
                label: _('Cancel'),
                action: () => {
                    this.close();
                },
            });

            if (isInEditMode) {
                const deleteButton = this.addButton({
                    label: _('Delete'),
                    action: () => {
                        this.emit('delete-clicked', this._appId);
                        this.close();
                    },
                });
                deleteButton.add_style_class_name('cso-shortcut-dialog-delete-button');
            }

            const saveButton = this.addButton({
                label: _('Save'),
                action: () => {
                    const description = descriptionEntry.get_text().trim();
                    const shortcut = shortcutEntry.get_text().trim();

                    if (!description || !shortcut) {
                        return;
                    }

                    this.emit('form-filled', this._appId, description, shortcut);
                    this.close();
                },
            });

            const updateSaveButtonState = () => {
                const description = descriptionEntry.get_text().trim();
                const shortcut = shortcutEntry.get_text().trim();
                const isValid = description.length > 0 && shortcut.length > 0;

                saveButton.reactive = isValid;
                saveButton.can_focus = isValid;
                saveButton.sensitive = isValid;
            };

            // No need to disconnect here, since both part will be destructed together
            descriptionEntry.connect('notify::text', updateSaveButtonState);
            shortcutEntry.connect('notify::text', updateSaveButtonState);

            updateSaveButtonState();
        }
    }
);