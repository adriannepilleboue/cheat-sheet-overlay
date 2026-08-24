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

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

const extension = ".json";

///////////////////////////////////////////////////////////////
export const CSOStoredData = GObject.registerClass(
    {
        Signals: {
            'data-updated': {
                param_types: [],
            }
        },
    },
    class GCSOStoredData extends GObject.Object {
        _ensureAndGetUserConfigDir() {
            const configDirPath = GLib.build_filenamev([GLib.get_user_config_dir(), 'cheat-sheet-overlay']);
            const dir = Gio.File.new_for_path(configDirPath);

            if (!dir.query_exists(null)) {
                try {
                    dir.make_directory_with_parents(null);
                    this._logger.log(`Created user directory: ${configDirPath}`);
                } catch (e) {
                    this._logger.error(`Failed to create directory ${configDirPath}: ${e}`);
                }
            }
            return configDirPath;
        }

        async _loadOneSheet(filePath, appId) {
            const file = Gio.File.new_for_path(filePath);

            try {
                const [contents] = await file.load_contents_async(null);
                const text = new TextDecoder('utf-8').decode(contents);
                const parsed = JSON.parse(text);

                const appShortcuts = parsed.shortcuts;
                this._appShortcuts[appId] = appShortcuts;
            } catch (err) {
                this._logger.error(`Failed to parse cheat sheet file ${filePath}: ${err}`);
            }
        }

        async loadAllSheets() {
            const cheatSheetsDir = this._ensureAndGetUserConfigDir();

            const dir = Gio.File.new_for_path(cheatSheetsDir);

            try {
                const enumerator = dir.enumerate_children(
                    'standard::name,standard::type',
                    Gio.FileQueryInfoFlags.NONE,
                    null
                );

                const promises = [];
                let info;
                while ((info = enumerator.next_file(null)) !== null) {
                    const name = info.get_name();
                    if (info.get_file_type() === Gio.FileType.REGULAR && name.endsWith(extension)) {
                        const filePath = GLib.build_filenamev([cheatSheetsDir, name]);
                        const appId = name.slice(0, -extension.length);
                        promises.push(this._loadOneSheet(filePath, appId));
                    }
                }
                await Promise.all(promises);
                enumerator.close(null);
            } catch (e) {
                this._logger.error(`Failed to load ${dir}: ${e}`);
            }

            this.emit('data-updated');
        }

        _saveOneSheet(filePath, appId) {
            const appShortcuts = this._appShortcuts[appId] ?? [];
            const dataToSave = {
                $schema: this.extensionPath + "/sheet.schema.json",
                shortcuts: appShortcuts,
            };

            try {
                const jsonString = JSON.stringify(dataToSave, null, 4);
                GLib.file_set_contents(filePath, jsonString);
            } catch (err) {
                this._logger.error(`Failed to save cheat sheet file ${filePath}: ${err}`);
            }
        }

        constructor(logger, extensionPath) {
            super();

            this._appShortcuts = {};
            this._logger = logger;
            this.extensionPath = extensionPath;
        }

        getAppShortcuts(appId) {
            return this._appShortcuts[appId];
        }

        addShortcut(appId, name, shortcut) {
            if (!this._appShortcuts[appId]) {
                this._appShortcuts[appId] = [];
            }

            this._appShortcuts[appId].push({
                name: name,
                shortcut: shortcut,
            });

            const cheatSheetsDir = this._ensureAndGetUserConfigDir();
            const filePath = GLib.build_filenamev([cheatSheetsDir, `${appId}${extension}`]);
            this._saveOneSheet(filePath, appId);

            this.emit('data-updated');
        }

        editShortcut(appId, oldName, oldShortcut, newName, newShortcut) {
            if (!this._appShortcuts[appId]) {
                this._logger.error(`No shortcuts found for appId: ${appId}`);
                return;
            }

            const entryCmp = (entry) => (entry.name === oldName &&
                entry.shortcut.join(' ') === oldShortcut.join(' '));
            const index = this._appShortcuts[appId].findIndex(entryCmp);

            if (index !== -1) {
                this._appShortcuts[appId][index] = {
                    name: newName,
                    shortcut: newShortcut,
                };

                const cheatSheetsDir = this._ensureAndGetUserConfigDir();
                const filePath = GLib.build_filenamev([cheatSheetsDir, `${appId}${extension}`]);
                this._saveOneSheet(filePath, appId);

                this.emit('data-updated');
            } else {
                this._logger.error(`Shortcut entry not found for appId: ${appId}, name: ${oldName}, shortcut: ${oldShortcut.join(' ')}`);
            }
        }

        deleteShortcut(appId, name, shortcut) {
            if (!this._appShortcuts[appId]) {
                this._logger.error(`No shortcuts found for appId: ${appId}`);
                return;
            }

            const entryCmp = (entry) => (entry.name === name &&
                entry.shortcut.join(' ') === shortcut.join(' '));
            const index = this._appShortcuts[appId].findIndex(entryCmp);

            if (index !== -1) {
                this._appShortcuts[appId].splice(index, 1);

                const cheatSheetsDir = this._ensureAndGetUserConfigDir();
                const filePath = GLib.build_filenamev([cheatSheetsDir, `${appId}${extension}`]);
                this._saveOneSheet(filePath, appId);

                this.emit('data-updated');
            } else {
                this._logger.error(`Shortcut entry not found for appId: ${appId}, name: ${name}, shortcut: ${shortcut.join(' ')}`);
            }
        }
    }
);