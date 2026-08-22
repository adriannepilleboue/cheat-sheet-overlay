/* shortcuts-sheet-widget.js
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
import { CSOShortcutWidget } from './shortcut-widget.js';

///////////////////////////////////////////////////////////////
export const CSOShortcutsSheetWidget = GObject.registerClass(
    {
        Signals: {
            'shortcut-clicked': {
                param_types: [GObject.TYPE_STRING, GObject.TYPE_STRING],
            }
        },
    },
    class GCSOShortcutsSheetWidget extends St.BoxLayout {
        _addShortcutEntry(shortcutEntry) {
            const button = new St.Button({
                style_class: 'cso-shortcuts-sheet-button',
                reactive: true,
                can_focus: true,
                track_hover: true,
            });

            const hbox = new St.BoxLayout({
                style_class: 'cso-shortcuts-sheet-hbox',
                x_expand: true,
                x_align: Clutter.ActorAlign.FILL,
            });
            button.add_child(hbox);

            hbox.add_child(new St.Label({
                text: shortcutEntry.name,
                style_class: 'cso-shortcuts-sheet-name',
                x_expand: true
            }));

            hbox.add_child(new CSOShortcutWidget(shortcutEntry.shortcut));

            button.connect('clicked', () => {
                this.emit('shortcut-clicked', shortcutEntry.name, shortcutEntry.shortcut.join(' '));
            });

            this.add_child(button);
        }

        constructor(shortcutsData) {
            super({
                vertical: true,
                style_class: 'cso-shortcuts-sheet-vbox',
            });

            // Sheets
            shortcutsData.forEach(shortcutEntry => {
                this._addShortcutEntry(shortcutEntry);
            });
        }
    }
);