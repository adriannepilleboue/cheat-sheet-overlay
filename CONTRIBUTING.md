# Contributing

## Testing and validation
To test the extension during development:
```
dbus-run-session gnome-shell --devkit --wayland
```
[See GNOME guide for details & alternatives](https://gjs.guide/extensions/development/creating.html)

To use the linter, install the JavaScript development dependencies with: `npm install`.
Then, run the JavaScript linter with: `npm run lint`

## Schemas
To compile the schemas:
```
glib-compile-schemas schemas/
```

## Translation
Regenerate the template.pot file:
```
xgettext -o po/template.pot -L JavaScript --from-code=UTF-8 src/*.js src/components/*.js
```

To compile a translation:
```
msgfmt po/fr.po -o locale/fr/LC_MESSAGES/cheat.sheet@overlay.org.mo
```
