/* shortcut-widget.js
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

///////////////////////////////////////////////////////////////
export const CSOShortcutWidget = GObject.registerClass(
    class GCSOShortcutWidget extends St.BoxLayout {
        constructor(keys) {
            super({
                style_class: 'cso-shortcut-hbox',
                x_expand: false,
            });

            keys.forEach(keyName => {
                const descriptionLabel = new St.Label({
                    text: keyName,
                    x_expand: false,
                    style_class: 'cso-shortcut-key',
                });

                const lowerCaseKeyName = keyName.toLowerCase();
                if (lowerCaseKeyName === "super") {
                    descriptionLabel.add_style_class_name('cso-shortcut-super');
                }
                else if (lowerCaseKeyName === "ctrl") {
                    descriptionLabel.add_style_class_name('cso-shortcut-ctrl');
                }
                else if (lowerCaseKeyName === "alt") {
                    descriptionLabel.add_style_class_name('cso-shortcut-alt');
                }
                else if (lowerCaseKeyName === "shift") {
                    descriptionLabel.add_style_class_name('cso-shortcut-shift');
                }

                this.add_child(descriptionLabel); // 'this' is the box layout itself
            });
        }
    }
);