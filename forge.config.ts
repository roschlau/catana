import type {ForgeConfig} from '@electron-forge/shared-types'
import {MakerSquirrel} from '@electron-forge/maker-squirrel'
import {MakerDeb} from '@electron-forge/maker-deb'
import {MakerRpm} from '@electron-forge/maker-rpm'
import {VitePlugin} from '@electron-forge/plugin-vite'
import {FusesPlugin} from '@electron-forge/plugin-fuses'
import {FuseV1Options, FuseVersion} from '@electron/fuses'
import {PublisherGithub} from '@electron-forge/publisher-github'
import {MakerDMG} from '@electron-forge/maker-dmg'
import {MakerZIP} from '@electron-forge/maker-zip'
import {MakerFlatpak} from '@electron-forge/maker-flatpak'

const icon_base = process.env.CATANA_ENV === 'dev' ? 'dev_catana' : 'catana'
console.log('Environment: ', process.env.ENVIRONMENT, icon_base)

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: 'src/renderer/assets/app-icon/' + icon_base,
    executableName: 'catana', // Needs to be identical to `name` in package.json, see https://github.com/electron/forge/issues/3753#issuecomment-2641436481
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: 'https://roschlau.me/img/catana.ico',
      setupIcon: 'src/renderer/assets/app-icon/' + icon_base + '.ico',
    }),
    new MakerDMG({
      icon: 'src/renderer/assets/app-icon/' + icon_base + '.icns',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: 'src/renderer/assets/app-icon/' + icon_base + '.png',
        categories: ['Office'],
        homepage: 'https://github.com/roschlau/catana',
      }
    }),
    new MakerDeb({
      options: {
        icon: 'src/renderer/assets/app-icon/' + icon_base + '.png',
        section: 'misc',
        categories: ['Office'],
        homepage: 'https://github.com/roschlau/catana',
      },
    }),
    new MakerFlatpak({
      options: {
        files: [],
        icon: 'src/renderer/assets/app-icon/' + icon_base + '.png',
        categories: ['Office'],
        id: 'me.roschlau.Catana',
        finishArgs: [
          '--share=network',
          '--socket=x11',
          '--socket=wayland',
          '--device=dri',
          '--share=ipc',
        ],
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'roschlau',
        name: 'catana',
      },
      prerelease: false,
      generateReleaseNotes: true,
      authToken: process.env.GITHUB_TOKEN,
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
