# 減量プラン管理アプリ

React Native + Expo + Supabaseで構築された減量プラン管理アプリです。  
加えて、LLM連携用のGo API（Docker起動）を同一リポジトリで管理します。

## 機能

- **Today画面**: 今日のやることリスト、食事メニュー、ジムメニュー、目標サマリを表示
- **体重ログ**: 毎朝の体重と週1回のウエストを記録
- **買い物リスト**: 今週必要な食材をカテゴリ別に表示
- **週間プラン**: 週間のプランを確認（今後実装予定）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabaseデータベースのセットアップ

#### 3.1 マイグレーションの実行

1. Supabase Dashboardにログイン
2. SQL Editorを開く
3. `supabase/migrations/001_initial_schema.sql`の内容をコピー＆ペースト
4. 実行してテーブルとRLSポリシーを作成

#### 3.2 匿名認証の有効化

1. Supabase Dashboard → Authentication → Providers
2. Anonymous を有効化

#### 3.3 （任意）シードデータの実行

1. SQL Editorを開く
2. `supabase/seed.sql`の内容をコピー＆ペースト
3. 実行してサンプルデータを投入

**注意**: 現在のアプリフローでは`seed_user_data()`は自動実行されません。必要な場合のみ手動で実行してください。

```sql
SELECT seed_user_data();
```

### 4. アプリの起動

```bash
npm start
```

iOSシミュレーターで起動する場合：

```bash
npm run ios
```

Androidエミュレーターで起動する場合：

```bash
npm run android
```

## Go API（LLM用）起動

### 1. API環境変数を作成

`apps/api/.env.example` をコピーして `apps/api/.env` を作成し、値を設定します。

```bash
cp apps/api/.env.example apps/api/.env
```

最低限 `OPENAI_API_KEY` を設定してください。

### 2. DockerでAPIを起動

```bash
npm run docker:up
```

停止:

```bash
npm run docker:down
```

ログ確認:

```bash
npm run api:logs
```

### 3. 動作確認

```bash
curl http://localhost:8080/health
```

LLMエンドポイント:

- `POST http://localhost:8080/v1/llm/chat`
- body例:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "今日の食事の提案をして" }
  ]
}
```

### 4. Swagger/OpenAPI生成

Goコードコメントから OpenAPI を生成できます。

```bash
npm run api:swagger
```

生成物:

- `apps/api/internal/docs/swagger.json`
- `apps/api/internal/docs/swagger.yaml`

Swagger UI:

- `http://localhost:8080/swagger/index.html`

### 5. React Native用クライアント生成（orval）

```bash
npm run api:client:generate
```

生成先:

- `lib/generated/llmApi.ts`

React Native側は生成された関数を呼ぶだけでAPIを実行できます。

## プロジェクト構造

```
daily-life-support/
├── apps/
│   └── api/                 # Go API（LLM連携）
│       ├── cmd/server/main.go
│       ├── Dockerfile
│       └── .env.example
├── app/                    # Expo Router 画面
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── today.tsx      # Today画面
│   │   ├── week.tsx       # 週間ビュー
│   │   ├── logs.tsx       # 記録画面
│   │   └── shopping-list.tsx # 買い物リスト
│   └── _layout.tsx         # ルートレイアウト
├── components/             # 再利用可能なコンポーネント
│   ├── TodoList.tsx
│   ├── MealPlan.tsx
│   ├── WorkoutPlan.tsx
│   └── ShoppingList.tsx
├── hooks/                  # カスタムフック
│   ├── useDayPlan.ts
│   ├── useTodoItems.ts
│   ├── useMealPlan.ts
│   ├── useWorkoutPlan.ts
│   ├── useDailyLog.ts
│   └── useShoppingList.ts
├── lib/                    # ライブラリ設定
│   └── supabase.ts         # Supabaseクライアント
├── supabase/               # データベース関連
│   ├── migrations/         # マイグレーションファイル
│   └── seed.sql            # シードデータ
├── infra/
│   └── docker-compose.yml  # Go API起動定義
└── types/                  # TypeScript型定義
    └── database.types.ts
```

## 技術スタック

- **React Native**: モバイルアプリ開発
- **Expo**: 開発環境とビルドツール
- **Expo Router**: ファイルベースルーティング
- **Supabase**: バックエンド（PostgreSQL + Auth + REST API）
- **Go**: LLM用APIサーバー
- **Docker**: Go APIのローカル起動
- **React Query**: データフェッチングとキャッシュ
- **TypeScript**: 型安全性

## 開発メモ

### 認証

アプリは匿名認証を使用しています。初回起動時に匿名ユーザーが作成されます。週間プランと食事メニューはアプリ内の作成フローで登録します。

### データベース

- すべてのテーブルにRow Level Security (RLS)が設定されています
- ユーザーは自分のデータのみアクセス可能
- `auth.uid() = user_id`のポリシーで保護されています

### 環境変数

Expoでは環境変数に`EXPO_PUBLIC_`プレフィックスが必要です。これにより、クライアント側でアクセス可能になります。

## 今後の実装予定

- [ ] 週間ビューの詳細実装
- [ ] 種目ログ（重量/回数/セット）の入力機能
- [ ] 体重の7日平均計算
- [ ] 買い物リストの購入チェック保存機能
- [ ] 停滞検知＆提案機能
- [ ] 食材代替の週次適用
- [ ] ヘルス連携（歩数・睡眠）

## ライセンス

個人利用のみ

