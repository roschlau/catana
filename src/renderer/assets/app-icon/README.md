To update app icons, first update all size-specific pngs, then run these commands to create the rest automatically:

```bash
# Prod Icons
magick catana_16.png catana_32.png catana_64.png catana_128.png catana_256.png catana.ico
cp catana_256.png catana.png

# Dev Icons
magick dev_catana_16.png dev_catana_32.png dev_catana_64.png dev_catana_128.png dev_catana_256.png dev_catana.ico
cp dev_catana_256.png dev_catana.png
```
