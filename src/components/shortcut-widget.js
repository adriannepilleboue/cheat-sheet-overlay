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
import Clutter from 'gi://Clutter';
import St from 'gi://St';

///////////////////////////////////////////////////////////////
export const CSOShortcutWidget = GObject.registerClass(
    class GCSOShortcutWidget extends St.BoxLayout {
        constructor(keys, modifiersState) {
            super({
                style_class: 'cso-shortcut-hbox',
                x_expand: false,
            });

            const isSuperPressed =
                ((modifiersState & Clutter.ModifierType.SUPER_MASK) !== 0) ||
                ((modifiersState & Clutter.ModifierType.META_MASK) !== 0) ||
                ((modifiersState & Clutter.ModifierType.HYPER_MASK) !== 0) ||
                ((modifiersState & Clutter.ModifierType.MOD4_MASK) !== 0);
            const isCtrlPressed = (modifiersState & Clutter.ModifierType.CONTROL_MASK) !== 0;
            const isAltPressed = (modifiersState & Clutter.ModifierType.MOD1_MASK) !== 0;
            const isShiftPressed = (modifiersState & Clutter.ModifierType.SHIFT_MASK) !== 0;

            let isSuperInvolved = false;
            let isCtrlInvolved = false;
            let isAltInvolved = false;
            let isShiftInvolved = false;

            keys.forEach(keyName => {
                const lowerCaseKeyName = keyName.toLowerCase();
                isSuperInvolved |= (lowerCaseKeyName === "super");
                isCtrlInvolved |= (lowerCaseKeyName === "ctrl");
                isAltInvolved |= (lowerCaseKeyName === "alt");
                isShiftInvolved |= (lowerCaseKeyName === "shift");
            });

            keys.forEach(keyName => {
                const descriptionLabel = new St.Label({
                    text: keyName,
                    x_expand: false,
                    style_class: 'cso-shortcut-key',
                });

                if (
                    (isSuperPressed && !isSuperInvolved) ||
                    (isCtrlPressed && !isCtrlInvolved) ||
                    (isAltPressed && !isAltInvolved) ||
                    (isShiftPressed && !isShiftInvolved)
                ) {
                    descriptionLabel.add_style_class_name('cso-shortcut-key-disabled');
                } else {
                    const lowerCaseKeyName = keyName.toLowerCase();
                    if (lowerCaseKeyName === "super") {
                        descriptionLabel.add_style_class_name(
                            isSuperPressed ? 'cso-shortcut-super-pressed' : 'cso-shortcut-super'
                        );
                    }
                    else if (lowerCaseKeyName === "ctrl") {
                        descriptionLabel.add_style_class_name(
                            isCtrlPressed ? 'cso-shortcut-ctrl-pressed' : 'cso-shortcut-ctrl'
                        );
                    }
                    else if (lowerCaseKeyName === "alt") {
                        descriptionLabel.add_style_class_name(
                            isAltPressed ? 'cso-shortcut-alt-pressed' : 'cso-shortcut-alt'
                        );
                    }
                    else if (lowerCaseKeyName === "shift") {
                        descriptionLabel.add_style_class_name(
                            isShiftPressed ? 'cso-shortcut-shift-pressed' : 'cso-shortcut-shift'
                        );
                    }
                }

                this.add_child(descriptionLabel); // 'this' is the box layout itself
            });
        }
    }
);