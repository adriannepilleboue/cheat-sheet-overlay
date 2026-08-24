/* prefs.js
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
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CheatSheetOverlayPreferences extends ExtensionPreferences {
    _augmentToggleOverlayRow(settings, page, row) {
        // Add a Gtk label that displays the shortcut.
        const toggleOverlayRowLabel = new Gtk.ShortcutLabel({
            disabled_text: _("Select a shortcut"),
            accelerator: settings.get_strv("toggle-overlay")[0],
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        });
        row.add_suffix(toggleOverlayRowLabel);

        // Make sure that the label is updated when the config change
        settings.connect("changed::toggle-overlay", () => {
            toggleOverlayRowLabel.set_accelerator(settings.get_strv("toggle-overlay")[0]);
        });

        // Make the row clickable to open the shortcut recording dialog.
        row.activatable_widget = toggleOverlayRowLabel;
        row.connect('activated', () => {
            const statusContent = new Adw.StatusPage({
                title: _("Define new shortcut"),
                icon_name: "preferences-desktop-keyboard-shortcuts-symbolic",
            });

            const shortcutDialog = new Adw.Window({
                modal: true,
                transient_for: page.get_root(),
                hide_on_close: true,
                width_request: 320,
                height_request: 240,
                resizable: false,
                content: statusContent,
            });

            const eventController = new Gtk.EventControllerKey();
            eventController.connect("key-pressed", (unused, keyval, keycode, state) => {
                let mask = state & Gtk.accelerator_get_default_mod_mask();
                mask &= ~Gdk.ModifierType.LOCK_MASK;  // Ignore Caps Lock

                // If the user presses Escape without any modifiers, close the dialog.
                if (!mask && keyval === Gdk.KEY_Escape) {
                    shortcutDialog.close();
                    return Gdk.EVENT_STOP;
                }

                // If the user presses only a modifier key, ignore it and wait for the next key press.
                if (keyval === Gdk.KEY_Control_L || keyval === Gdk.KEY_Control_R ||
                    keyval === Gdk.KEY_Shift_L || keyval === Gdk.KEY_Shift_R ||
                    keyval === Gdk.KEY_Alt_L || keyval === Gdk.KEY_Alt_R ||
                    keyval === Gdk.KEY_Super_L || keyval === Gdk.KEY_Super_R) {
                    return Gdk.EVENT_STOP;
                }

                // Valid case: user pressed a key with modifiers. Update the settings and close the dialog.
                settings.set_strv("toggle-overlay", [
                    Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask),
                ]);
                shortcutDialog.destroy();
                return Gdk.EVENT_STOP;
            });
            shortcutDialog.add_controller(eventController);

            shortcutDialog.present();
        });
    }

    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const builder = new Gtk.Builder();
        builder.add_from_file(`${this.path}/ui/prefs.ui`);

        const page = builder.get_object('preferences-page');

        // General Group / Show Indicator
        const showIndicatorSwitch = builder.get_object('show-indicator-switch');
        showIndicatorSwitch.set_active(settings.get_boolean('show-indicator'));
        settings.bind('show-indicator', showIndicatorSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        
        // General Group / Show System Sheet
        const showSystemSheetSwitch = builder.get_object('show-system-sheet-switch');
        showSystemSheetSwitch.set_active(settings.get_boolean('show-system-sheet'));
        settings.bind('show-system-sheet', showSystemSheetSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        
        // General Group / Show Application Sheets
        const showApplicationSheetsSwitch = builder.get_object('show-application-sheets-switch');
        showApplicationSheetsSwitch.set_active(settings.get_boolean('show-application-sheets'));
        settings.bind('show-application-sheets', showApplicationSheetsSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Shortcut Group / Toggle Overlay
        this._augmentToggleOverlayRow(settings, page, builder.get_object('toggle-overlay-row'));

        window.add(page);
    }
}
