# TestFlight配布手順

## 前提条件

1. **Expoアカウント**: [https://expo.dev](https://expo.dev) でアカウント作成
2. **Apple Developer Program**: 年間$99で登録が必要（TestFlight利用のため）
3. **EAS CLI**: インストールが必要

## セットアップ手順

### 0. Expoアカウントの作成（まだの場合）

1. [https://expo.dev/signup](https://expo.dev/signup) にアクセス
2. メールアドレス（例: `hirok.tiko0527@icloud.com`）でアカウントを作成
3. メール認証を完了
4. パスワードを設定

**注意**: ExpoアカウントとApple Developer Programは別のアカウントです。

### 1. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 2. Expoアカウントにログイン

```bash
eas login
```

### 3. プロジェクトをEASにリンク

```bash
eas build:configure
```

このコマンドで：
- `eas.json`が作成・更新されます
- プロジェクトがExpoアカウントにリンクされます
- `app.json`の`extra.eas.projectId`が自動設定されます

### 4. Apple Developer Programの設定

#### 4.1 Apple Developer Programに登録
- [Apple Developer](https://developer.apple.com/programs/) で登録（年間$99）

#### 4.2 App Store Connectでアプリを作成
- [App Store Connect](https://appstoreconnect.apple.com) にログイン
- 「マイApp」→「+」→「新しいApp」を選択
- アプリ情報を入力：
  - 名前: Daily Life Support
  - プライマリ言語: 日本語
  - バンドルID: `com.dailylifesupport.app`
  - SKU: 任意のユニークな文字列

### 5. 環境変数の設定（EAS Secrets）

Supabaseの認証情報をEAS Secretsに設定：

#### 方法1: Expo Dashboardで設定（推奨）

1. [Expo Dashboard](https://expo.dev/accounts/miyashitah/projects/daily-life-support/secrets) にアクセス
2. 「Secrets」タブを開く
3. 「Create Secret」をクリック
4. 以下の2つを追加：
   - **Name**: `EXPO_PUBLIC_SUPABASE_URL`
     **Value**: `https://ighkhlueuhxbeewhwztb.supabase.co`
     **Type**: Plain text
   - **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaGtobHVldWh4YmVld2h3enRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTIwMjQsImV4cCI6MjA4MzA4ODAyNH0.JpVUckAY8tCPi51s44Txv6uPfN7JMftmLl0A14zXN3o`
     **Type**: Sensitive

#### 方法2: コマンドラインで設定（非推奨、コマンドが変更されている可能性あり）

```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://ighkhlueuhxbeewhwztb.supabase.co --type string
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaGtobHVldWh4YmVld2h3enRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTIwMjQsImV4cCI6MjA4MzA4ODAyNH0.JpVUckAY8tCPi51s44Txv6uPfN7JMftmLl0A14zXN3o --type string
```

### 6. iOSビルドの実行

#### 6.1 初回ビルド（証明書の自動生成）

```bash
eas build --platform ios --profile production
```

このコマンドで：
- Apple Developer Programの認証情報を求められます
- 証明書とプロビジョニングプロファイルが自動生成されます
- ビルドが開始されます（10-20分程度かかります）

#### 6.2 ビルド状況の確認

```bash
eas build:list
```

または、[Expo Dashboard](https://expo.dev/accounts/[your-account]/projects/daily-life-support/builds) で確認

### 7. TestFlightへのアップロード

ビルドが完了したら、TestFlightに自動アップロード：

```bash
eas submit --platform ios --latest
```

または、Expo Dashboardから「Submit to App Store」をクリック

### 8. TestFlightでの確認

1. App Store Connectにログイン
2. 「TestFlight」タブを開く
3. ビルドが処理されるまで待つ（数分〜数時間）
4. 処理が完了したら、内部テスターとして自分を追加
5. iPhoneのTestFlightアプリで確認

## 注意事項

- **初回ビルド**: Apple Developer Programの認証情報が必要
- **ビルド時間**: 通常10-20分、混雑時は30分以上かかる場合あり
- **TestFlight処理**: アップロード後、Apple側の処理に数分〜数時間かかる
- **環境変数**: EAS Secretsに設定した環境変数は、ビルド時に自動的に注入されます

## トラブルシューティング

### ビルドエラーが発生した場合

```bash
eas build:list
```

でビルドログを確認

### 証明書エラー

```bash
eas credentials
```

で証明書を確認・再生成

### チームが自動選択されてしまう場合

前の会社のチームが自動選択されてしまう場合は、以下の手順で解決：

1. **保存されているApple IDセッションをクリア**:
   ```bash
   rm -rf ~/.app-store/auth/hirok.tiko0527@icloud.com
   ```

2. **個人のApple Developer Programがアクティベートされているか確認**:
   - [Apple Developer](https://developer.apple.com/account) にログイン
   - メンバーシップが有効になっているか確認

3. **再度ビルドを実行**:
   ```bash
   eas build --platform ios --profile production
   ```
   - ログイン時に個人のチームを選択
   - チーム選択のプロンプトで、個人のチーム（ALBONA Inc.ではない）を選択

4. **または、証明書を手動で管理**:
   ```bash
   eas credentials
   ```
   - iOS → production → 証明書を削除して再生成
   - チーム選択時に個人のチームを選択

### 環境変数が読み込まれない

`app.config.js`で環境変数を正しく読み込んでいるか確認

