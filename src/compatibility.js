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
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

// GNOME 48 introduces this.getLogger()
export function compatibleLogger(extension) {
    // getLogger was introduced by GNOME 48
    if (typeof extension.getLogger === "function") {
        return extension.getLogger();
    }
    
    // Fallback for GNOME 47-
    return {
        debug: (...args) => console.debug(`[${extension.metadata.uuid}]`, ...args),
        info: (...args) => console.info(`[${extension.metadata.uuid}]`, ...args),
        warn: (...args) => console.warn(`[${extension.metadata.uuid}]`, ...args),
        error: (...args) => console.error(`[${extension.metadata.uuid}]`, ...args),
    };
}

// GNOME 48 introduces Clutter.Orientation.VERTICAL
export function compatibleVertical() {
    const majorVersion = parseInt(Config.PACKAGE_VERSION.split('.')[0], 10);
    if (majorVersion >= 48) {
        return { orientation: Clutter.Orientation.VERTICAL };
    }
    
    // Fallback for GNOME 47-
    return { vertical: true };
}