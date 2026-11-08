const { withAndroidManifest, withAppBuildGradle } = require('expo/config-plugins');

// Let the main activity show over the lock screen and wake the display (full-screen alarm).
const withLockScreenActivity = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    const main = app.activity.find((a) => a.$['android:name'] === '.MainActivity');
    main.$['android:showWhenLocked'] = 'true';
    main.$['android:turnScreenOn'] = 'true';
    return cfg;
  });

// Sign release builds with the keystore described in ~/.gradle/gradle.properties
// (PILLS_STORE_FILE / PILLS_STORE_PASSWORD / PILLS_KEY_ALIAS / PILLS_KEY_PASSWORD).
const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('PILLS_STORE_FILE')) return cfg;
    const releaseConfig = `        release {
            storeFile file(project.property('PILLS_STORE_FILE'))
            storePassword project.property('PILLS_STORE_PASSWORD')
            keyAlias project.property('PILLS_KEY_ALIAS')
            keyPassword project.property('PILLS_KEY_PASSWORD')
        }
`;
    src = src.replace(/signingConfigs \{\n/, (m) => m + releaseConfig);
    // point the release buildType at the release signing config
    src = src.replace(
      /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = (config) => withReleaseSigning(withLockScreenActivity(config));
