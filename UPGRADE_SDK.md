# Expo SDK アップグレード手順

## 現在の状態
- Expo SDK: 51.0.0
- React Native: 0.74.5

## アップグレード手順

### 1. Expo SDKを最新バージョンにアップグレード

```bash
npx expo install expo@latest
```

このコマンドで、Expo SDKが最新バージョン（SDK 52以降）にアップグレードされます。

### 2. 依存関係を自動修正

```bash
npx expo install --fix
```

このコマンドで、Expo SDKに合わせてすべての依存関係が自動的に更新されます。

### 3. パッケージをインストール

```bash
npm install
```

### 4. キャッシュをクリアして起動

```bash
npx expo start --clear
```

### 5. 動作確認

- アプリが正常に起動するか確認
- 主要な機能が動作するか確認

## 注意事項

- アップグレード後、一部のAPIや動作が変更されている可能性があります
- エラーが発生した場合は、エラーメッセージを確認して対応してください
- 必要に応じて、`app.config.js`や`eas.json`の設定を確認してください

## アップグレード後の確認事項

- [ ] アプリが正常に起動する
- [ ] 主要な機能が動作する
- [ ] ビルドが成功する（`eas build --platform ios --profile production`）

