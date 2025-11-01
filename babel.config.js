module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    
    //plugins: ['react-native-reanimated/plugin'],
    //plugins: ['react-native-worklets/plugin'], // Reanimated 필수 설정
    plugins: [
      // ...다른 플러그인들
      'react-native-worklets/plugin', // 🔁 여기! reanimated/plugin → worklets/plugin
    ],
  };
};
