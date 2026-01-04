# 減量プラン管理アプリ

「半年で-20kg」を達成するための毎日のやること（ToDo）・食事メニュー・ジムメニューを管理するアプリです。

## 技術スタック

- **フロントエンド**: React Native (Expo)
- **バックエンド**: Next.js (API Routes)
- **データベース**: Neon (PostgreSQL)
- **ORM**: Prisma
- **状態管理**: React Query
- **ナビゲーション**: React Navigation (Drawer)

## プロジェクト構造

```
daily-life-support/
├── app/          # Expo React Nativeアプリ
├── api/          # Next.js APIサーバー
└── task.md       # 要件定義書
```

## セットアップ手順

### 1. データベースのセットアップ

1. [Neon](https://neon.tech/)でPostgreSQLデータベースを作成
2. `api/.env`ファイルを作成し、`DATABASE_URL`を設定：

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 2. APIサーバーのセットアップ

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

APIサーバーは `http://localhost:3000` で起動します。

### 3. Expoアプリのセットアップ

```bash
cd app
npm install
```

`.env`ファイルを作成し、API URLを設定：

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

開発サーバーを起動：

```bash
npm start
```

### 4. 実機での動作確認

1. Expo Goアプリをインストール（iOS/Android）
2. 開発サーバー起動後、QRコードをスキャン
3. または、`npm run ios` / `npm run android` でエミュレータで起動

## 主な機能

### P0（MVP）

- ✅ Today画面（Todo + 食事 + ジムメニュー + 目標サマリ）
- ✅ Shopping List画面（今週の食材リスト表示）
- ✅ 曜日別ワークアウトテンプレート表示
- ✅ 体重ログ（準備中）

### P1（次期実装予定）

- 週間ビュー
- 種目ログ（重量/回数）
- 7日平均（体重）
- ShoppingListの購入チェック保存

## データベーススキーマ

主要なエンティティ：

- `User` - ユーザー情報
- `Plan` - 半年プラン
- `DayPlan` - 特定日のプラン
- `MealTemplate` / `MealPlan` / `MealItem` - 食事関連
- `WorkoutTemplate` / `WorkoutPlan` / `ExerciseTemplate` - ワークアウト関連
- `TodoTemplate` / `TodoItem` - Todo関連
- `DailyLog` - 日次ログ（体重、ウエスト等）
- `Ingredient` / `MealItemIngredient` - 食材関連
- `ShoppingList` / `ShoppingListItem` - 買い物リスト

詳細は `api/prisma/schema.prisma` を参照してください。

## 開発コマンド

### APIサーバー

```bash
cd api
npm run dev          # 開発サーバー起動
npm run db:seed      # シードデータ投入
npm run db:studio    # Prisma Studio起動
npm run db:migrate   # マイグレーション実行
```

### Expoアプリ

```bash
cd app
npm start            # 開発サーバー起動
npm run ios          # iOSエミュレータで起動
npm run android      # Androidエミュレータで起動
```

## 環境変数

### APIサーバー (`api/.env`)

```env
DATABASE_URL="postgresql://..."
```

### Expoアプリ (`app/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 注意事項

- 個人利用を想定したアプリです（ストア公開なし）
- 最終的にはEASでビルドし、TestFlight経由で配布予定
- DB接続情報は絶対にアプリに埋め込まない（APIサーバー経由のみ）

## ライセンス

個人利用のみ

