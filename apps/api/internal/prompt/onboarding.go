package prompt

import (
	"fmt"

	"daily-life-support/apps/api/internal/llm"
)

func BuildOnboardingSuggestion(input llm.OnboardingPlanInput) string {
	return fmt.Sprintf(
		`あなたは減量コーチです。以下の条件で、今日から始める実行しやすい提案を日本語で作成してください。

条件:
- 体重: %.1fkg
- 身長: %.1fcm
- 目標体重: %.1fkg
- 達成希望期間: %d%s
- 仕事: %s
- トレーニング環境: %s

出力ルール:
1. 「最初の2週間でやること」を箇条書きで3つ
2. 「1日の食事方針」を箇条書きで3つ
3. 「週の運動方針」を箇条書きで3つ
4. 最後に短い励ましを1文
5. 全体は簡潔に`,
		input.WeightKg,
		input.HeightCm,
		input.TargetWeightKg,
		input.TargetDurationValue,
		durationLabel(input.TargetDurationUnit),
		input.Occupation,
		trainingModeLabel(input.TrainingMode),
	)
}

func BuildOnboardingStructuredPlanJSON(input llm.OnboardingPlanInput) string {
	if input.TrainingMode == "BODYWEIGHT" {
		return BuildOnboardingStructuredPlanJSONBodyweight(input)
	}
	return BuildOnboardingStructuredPlanJSONGym(input)
}

func BuildOnboardingStructuredPlanJSONGym(input llm.OnboardingPlanInput) string {
	return buildOnboardingStructuredPlanJSON(
		input,
		`- trainingMode が GYM の場合、TRAINING_DAY と HYBRID_DAY の各日で最低1種目はジム器具を使う種目を入れる
  （例: ベンチプレス, ラットプルダウン, ショルダープレス, レッグプレス, シーテッドロー, ダンベル種目）
- trainingMode が GYM の場合、TRAINING_DAY / HYBRID_DAY を自重種目のみ（プッシュアップ/プランク/自重スクワットだけ等）で構成しない
- TRAINING_DAY では cardioDurationMinutes を設定しない（null）
- TRAINING_DAY では体幹のみ（プランク等のみ）の構成にしない`,
		`{
  "version": "1",
  "timezone": "Asia/Tokyo",
  "dayPlans": [{"dayOfWeek":1,"dayType":"TRAINING_DAY"}],
  "mealsByDayType": {
    "TRAINING_DAY": [
      {"mealType":"BREAKFAST","name":"オートミールボウル","items":[{"name":"オートミール 60g","quantity":60,"unit":"g","calories":228,"protein":7.6,"fat":4.2,"carbs":41.2,"orderIndex":0},{"name":"無脂肪ギリシャヨーグルト 150g","quantity":150,"unit":"g","calories":90,"protein":15,"fat":0.3,"carbs":5.4,"orderIndex":1}]},
      {"mealType":"BREAKFAST","name":"全粒粉トーストセット","items":[{"name":"全粒粉食パン 2枚","quantity":2,"unit":"slice","calories":220,"protein":10,"fat":3.2,"carbs":38,"orderIndex":0},{"name":"ゆで卵 2個","quantity":2,"unit":"piece","calories":156,"protein":12.6,"fat":10.6,"carbs":1.2,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"鶏むね肉プレート","items":[{"name":"鶏むね肉 180g","quantity":180,"unit":"g","calories":297,"protein":55.8,"fat":6.5,"carbs":0,"orderIndex":0},{"name":"玄米 150g","quantity":150,"unit":"g","calories":234,"protein":3.8,"fat":1.5,"carbs":51.8,"orderIndex":1},{"name":"ブロッコリー 100g","quantity":100,"unit":"g","calories":33,"protein":4.3,"fat":0.5,"carbs":5.2,"orderIndex":2}]},
      {"mealType":"SNACK","name":"高たんぱく間食","items":[{"name":"プロテインバー 1本","quantity":1,"unit":"piece","calories":200,"protein":20,"fat":7,"carbs":18,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"トレ後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0},{"name":"バナナ 1本","quantity":1,"unit":"piece","calories":86,"protein":1.1,"fat":0.2,"carbs":22.5,"orderIndex":1}]},
      {"mealType":"DINNER","name":"鮭と野菜の定食","items":[{"name":"鮭 150g","quantity":150,"unit":"g","calories":240,"protein":31.5,"fat":12,"carbs":0,"orderIndex":0},{"name":"温野菜 200g","quantity":200,"unit":"g","calories":110,"protein":5.5,"fat":0.8,"carbs":22,"orderIndex":1}]}
    ],
    "CARDIO_DAY": [
      {"mealType":"BREAKFAST","name":"ヨーグルトフルーツ","items":[{"name":"プレーンヨーグルト 200g","quantity":200,"unit":"g","calories":124,"protein":8.6,"fat":6,"carbs":10.6,"orderIndex":0},{"name":"キウイ 1個","quantity":1,"unit":"piece","calories":53,"protein":1,"fat":0.4,"carbs":13.5,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"豆腐チキンサラダボウル","items":[{"name":"木綿豆腐 150g","quantity":150,"unit":"g","calories":108,"protein":10,"fat":6.6,"carbs":2.4,"orderIndex":0},{"name":"サラダチキン 100g","quantity":100,"unit":"g","calories":120,"protein":24.6,"fat":1.3,"carbs":0.2,"orderIndex":1}]},
      {"mealType":"SNACK","name":"軽食","items":[{"name":"ゆで卵 1個","quantity":1,"unit":"piece","calories":78,"protein":6.3,"fat":5.3,"carbs":0.6,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"運動後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0}]},
      {"mealType":"DINNER","name":"鶏むね肉と蒸し野菜","items":[{"name":"鶏むね肉 160g","quantity":160,"unit":"g","calories":264,"protein":49.6,"fat":5.8,"carbs":0,"orderIndex":0},{"name":"蒸し野菜 180g","quantity":180,"unit":"g","calories":95,"protein":4.8,"fat":0.6,"carbs":19.4,"orderIndex":1}]}
    ],
    "HYBRID_DAY": [
      {"mealType":"BREAKFAST","name":"高たんぱく朝食","items":[{"name":"オートミール 50g","quantity":50,"unit":"g","calories":190,"protein":6.3,"fat":3.5,"carbs":34.3,"orderIndex":0},{"name":"卵 2個","quantity":2,"unit":"piece","calories":156,"protein":12.6,"fat":10.6,"carbs":1.2,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"鶏むね丼","items":[{"name":"鶏むね肉 170g","quantity":170,"unit":"g","calories":281,"protein":52.7,"fat":6.2,"carbs":0,"orderIndex":0},{"name":"ごはん 150g","quantity":150,"unit":"g","calories":234,"protein":3.8,"fat":0.5,"carbs":53.4,"orderIndex":1}]},
      {"mealType":"SNACK","name":"間食","items":[{"name":"ギリシャヨーグルト 100g","quantity":100,"unit":"g","calories":60,"protein":10,"fat":0.2,"carbs":3.6,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"運動後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0},{"name":"バナナ 1本","quantity":1,"unit":"piece","calories":86,"protein":1.1,"fat":0.2,"carbs":22.5,"orderIndex":1}]},
      {"mealType":"DINNER","name":"サーモンプレート","items":[{"name":"サーモン 160g","quantity":160,"unit":"g","calories":256,"protein":33.6,"fat":12.8,"carbs":0,"orderIndex":0},{"name":"野菜スープ 200ml","quantity":200,"unit":"ml","calories":88,"protein":3.2,"fat":2,"carbs":14.4,"orderIndex":1}]}
    ],
    "REST_DAY": [
      {"mealType":"BREAKFAST","name":"和風朝食","items":[{"name":"ごはん 120g","quantity":120,"unit":"g","calories":187,"protein":3,"fat":0.4,"carbs":41.4,"orderIndex":0},{"name":"納豆 1パック","quantity":1,"unit":"pack","calories":100,"protein":8.3,"fat":5,"carbs":6.1,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"サバ味噌定食","items":[{"name":"サバ味噌煮 1切れ","quantity":1,"unit":"piece","calories":260,"protein":20,"fat":16,"carbs":8,"orderIndex":0},{"name":"ごはん 150g","quantity":150,"unit":"g","calories":234,"protein":3.8,"fat":0.5,"carbs":53.4,"orderIndex":1}]},
      {"mealType":"DINNER","name":"鮭と野菜プレート","items":[{"name":"鮭 140g","quantity":140,"unit":"g","calories":224,"protein":29.4,"fat":11.2,"carbs":0,"orderIndex":0},{"name":"野菜スープ 250ml","quantity":250,"unit":"ml","calories":110,"protein":4,"fat":2.5,"carbs":18,"orderIndex":1}]}
    ]
  },
  "workoutsByDay": [
    {"dayOfWeek":1,"dayType":"TRAINING_DAY","name":"胸・肩の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"ベンチプレス","targetSets":4,"targetRepsMin":8,"targetRepsMax":12,"orderIndex":0},{"name":"ショルダープレス","targetSets":3,"targetRepsMin":10,"targetRepsMax":12,"orderIndex":1}]},
    {"dayOfWeek":2,"dayType":"CARDIO_DAY","name":"有酸素のみ","cardioDurationMinutes":35,"cardioType":"WALK","exercises":[]},
    {"dayOfWeek":3,"dayType":"TRAINING_DAY","name":"下半身の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"レッグプレス","targetSets":4,"targetRepsMin":10,"targetRepsMax":15,"orderIndex":0},{"name":"ルーマニアンデッドリフト","targetSets":3,"targetRepsMin":8,"targetRepsMax":12,"orderIndex":1}]},
    {"dayOfWeek":4,"dayType":"HYBRID_DAY","name":"有酸素+上半身補助","cardioDurationMinutes":25,"cardioType":"BIKE","exercises":[{"name":"ラットプルダウン","targetSets":3,"targetRepsMin":10,"targetRepsMax":12,"orderIndex":0},{"name":"プランク","targetSets":3,"targetRepsMin":30,"targetRepsMax":45,"orderIndex":1}]},
    {"dayOfWeek":5,"dayType":"TRAINING_DAY","name":"背中・腕の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"ラットプルダウン","targetSets":4,"targetRepsMin":8,"targetRepsMax":12,"orderIndex":0},{"name":"シーテッドロー","targetSets":3,"targetRepsMin":10,"targetRepsMax":12,"orderIndex":1}]},
    {"dayOfWeek":0,"dayType":"REST_DAY","name":"休養","cardioDurationMinutes":null,"cardioType":null,"exercises":[]},
    {"dayOfWeek":6,"dayType":"REST_DAY","name":"休養","cardioDurationMinutes":null,"cardioType":null,"exercises":[]}
  ]
}`,
	)
}

func BuildOnboardingStructuredPlanJSONBodyweight(input llm.OnboardingPlanInput) string {
	return buildOnboardingStructuredPlanJSON(
		input,
		`- trainingMode が BODYWEIGHT の場合、器具が必要な種目（ベンチプレス、ラットプルダウン等）は含めない
- trainingMode が BODYWEIGHT の場合、TRAINING_DAY の各日は自重種目中心で構成する
  （例: プッシュアップ, ブルガリアンスクワット, ヒップヒンジ, プランク, マウンテンクライマー）
- TRAINING_DAY では cardioDurationMinutes を設定しない（null）
- TRAINING_DAY では体幹のみ（プランク等のみ）の構成にしない`,
		`{
  "version": "1",
  "timezone": "Asia/Tokyo",
  "dayPlans": [{"dayOfWeek":1,"dayType":"TRAINING_DAY"}],
  "mealsByDayType": {
    "TRAINING_DAY": [
      {"mealType":"BREAKFAST","name":"オートミールボウル","items":[{"name":"オートミール 60g","quantity":60,"unit":"g","calories":228,"protein":7.6,"fat":4.2,"carbs":41.2,"orderIndex":0},{"name":"プレーンヨーグルト 150g","quantity":150,"unit":"g","calories":93,"protein":6.4,"fat":4.5,"carbs":7.9,"orderIndex":1}]},
      {"mealType":"BREAKFAST","name":"卵とトースト","items":[{"name":"全粒粉トースト 2枚","quantity":2,"unit":"slice","calories":220,"protein":10,"fat":3.2,"carbs":38,"orderIndex":0},{"name":"目玉焼き 2個","quantity":2,"unit":"piece","calories":176,"protein":12.3,"fat":12.6,"carbs":0.8,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"鶏むねプレート","items":[{"name":"鶏むね肉 160g","quantity":160,"unit":"g","calories":264,"protein":49.6,"fat":5.8,"carbs":0,"orderIndex":0},{"name":"雑穀米 150g","quantity":150,"unit":"g","calories":240,"protein":4,"fat":1.2,"carbs":53,"orderIndex":1}]},
      {"mealType":"SNACK","name":"軽食","items":[{"name":"ミックスナッツ 20g","quantity":20,"unit":"g","calories":120,"protein":3.8,"fat":10.8,"carbs":3.8,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"運動後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0},{"name":"バナナ 1本","quantity":1,"unit":"piece","calories":86,"protein":1.1,"fat":0.2,"carbs":22.5,"orderIndex":1}]},
      {"mealType":"DINNER","name":"焼き魚定食","items":[{"name":"サーモン 150g","quantity":150,"unit":"g","calories":240,"protein":31.5,"fat":12,"carbs":0,"orderIndex":0},{"name":"豆腐 100g","quantity":100,"unit":"g","calories":72,"protein":6.6,"fat":4.2,"carbs":1.7,"orderIndex":1}]}
    ],
    "CARDIO_DAY": [
      {"mealType":"BREAKFAST","name":"フルーツヨーグルト","items":[{"name":"ヨーグルト 180g","quantity":180,"unit":"g","calories":112,"protein":7.7,"fat":5.4,"carbs":9.5,"orderIndex":0},{"name":"バナナ 1本","quantity":1,"unit":"piece","calories":86,"protein":1.1,"fat":0.2,"carbs":22.5,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"豆腐サラダプレート","items":[{"name":"豆腐 150g","quantity":150,"unit":"g","calories":108,"protein":10,"fat":6.6,"carbs":2.4,"orderIndex":0},{"name":"鶏むね肉 100g","quantity":100,"unit":"g","calories":165,"protein":31,"fat":3.6,"carbs":0,"orderIndex":1}]},
      {"mealType":"SNACK","name":"軽食","items":[{"name":"ゆで卵 1個","quantity":1,"unit":"piece","calories":78,"protein":6.3,"fat":5.3,"carbs":0.6,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"運動後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0}]},
      {"mealType":"DINNER","name":"鶏むね野菜炒め","items":[{"name":"鶏むね肉 150g","quantity":150,"unit":"g","calories":248,"protein":46.5,"fat":5.4,"carbs":0,"orderIndex":0},{"name":"キャベツ 120g","quantity":120,"unit":"g","calories":28,"protein":1.5,"fat":0.2,"carbs":6.2,"orderIndex":1}]}
    ],
    "HYBRID_DAY": [
      {"mealType":"BREAKFAST","name":"卵とオートミール","items":[{"name":"オートミール 50g","quantity":50,"unit":"g","calories":190,"protein":6.3,"fat":3.5,"carbs":34.3,"orderIndex":0},{"name":"卵 2個","quantity":2,"unit":"piece","calories":156,"protein":12.6,"fat":10.6,"carbs":1.2,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"ツナライスボウル","items":[{"name":"ツナ水煮 80g","quantity":80,"unit":"g","calories":92,"protein":20.8,"fat":0.6,"carbs":0,"orderIndex":0},{"name":"ごはん 150g","quantity":150,"unit":"g","calories":234,"protein":3.8,"fat":0.5,"carbs":53.4,"orderIndex":1}]},
      {"mealType":"SNACK","name":"間食","items":[{"name":"無糖ヨーグルト 120g","quantity":120,"unit":"g","calories":74,"protein":5.2,"fat":3.6,"carbs":6.3,"orderIndex":0}]},
      {"mealType":"POST_WORKOUT","name":"運動後補食","items":[{"name":"ホエイプロテイン 30g","quantity":30,"unit":"g","calories":120,"protein":24,"fat":1.8,"carbs":3,"orderIndex":0},{"name":"バナナ 1本","quantity":1,"unit":"piece","calories":86,"protein":1.1,"fat":0.2,"carbs":22.5,"orderIndex":1}]},
      {"mealType":"DINNER","name":"鶏むね野菜プレート","items":[{"name":"鶏むね肉 150g","quantity":150,"unit":"g","calories":248,"protein":46.5,"fat":5.4,"carbs":0,"orderIndex":0},{"name":"温野菜 180g","quantity":180,"unit":"g","calories":95,"protein":4.8,"fat":0.6,"carbs":19.4,"orderIndex":1}]}
    ],
    "REST_DAY": [
      {"mealType":"BREAKFAST","name":"和朝食","items":[{"name":"ごはん 100g","quantity":100,"unit":"g","calories":156,"protein":2.5,"fat":0.3,"carbs":35.6,"orderIndex":0},{"name":"納豆 1パック","quantity":1,"unit":"pack","calories":100,"protein":8.3,"fat":5,"carbs":6.1,"orderIndex":1}]},
      {"mealType":"LUNCH","name":"サバ定食","items":[{"name":"サバ塩焼き 1切れ","quantity":1,"unit":"piece","calories":235,"protein":20.6,"fat":16.8,"carbs":0.2,"orderIndex":0},{"name":"ごはん 150g","quantity":150,"unit":"g","calories":234,"protein":3.8,"fat":0.5,"carbs":53.4,"orderIndex":1}]},
      {"mealType":"DINNER","name":"鮭と野菜スープ","items":[{"name":"鮭 140g","quantity":140,"unit":"g","calories":224,"protein":29.4,"fat":11.2,"carbs":0,"orderIndex":0},{"name":"野菜スープ 250ml","quantity":250,"unit":"ml","calories":110,"protein":4,"fat":2.5,"carbs":18,"orderIndex":1}]}
    ]
  },
  "workoutsByDay": [
    {"dayOfWeek":1,"dayType":"TRAINING_DAY","name":"上半身の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"プッシュアップ","targetSets":4,"targetRepsMin":10,"targetRepsMax":15,"orderIndex":0},{"name":"パイクプッシュアップ","targetSets":3,"targetRepsMin":8,"targetRepsMax":12,"orderIndex":1}]},
    {"dayOfWeek":2,"dayType":"CARDIO_DAY","name":"有酸素のみ","cardioDurationMinutes":35,"cardioType":"WALK","exercises":[]},
    {"dayOfWeek":3,"dayType":"TRAINING_DAY","name":"下半身の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"ブルガリアンスクワット","targetSets":4,"targetRepsMin":8,"targetRepsMax":12,"orderIndex":0},{"name":"ヒップリフト","targetSets":3,"targetRepsMin":12,"targetRepsMax":15,"orderIndex":1}]},
    {"dayOfWeek":4,"dayType":"HYBRID_DAY","name":"有酸素+下半身補助","cardioDurationMinutes":25,"cardioType":"RUN","exercises":[{"name":"ブルガリアンスクワット","targetSets":3,"targetRepsMin":10,"targetRepsMax":12,"orderIndex":0},{"name":"プランク","targetSets":3,"targetRepsMin":30,"targetRepsMax":45,"orderIndex":1}]},
    {"dayOfWeek":5,"dayType":"TRAINING_DAY","name":"全身の日","cardioDurationMinutes":null,"cardioType":null,"exercises":[{"name":"ジャンプスクワット","targetSets":4,"targetRepsMin":10,"targetRepsMax":15,"orderIndex":0},{"name":"マウンテンクライマー","targetSets":3,"targetRepsMin":20,"targetRepsMax":30,"orderIndex":1}]},
    {"dayOfWeek":0,"dayType":"REST_DAY","name":"休養","cardioDurationMinutes":null,"cardioType":null,"exercises":[]},
    {"dayOfWeek":6,"dayType":"REST_DAY","name":"休養","cardioDurationMinutes":null,"cardioType":null,"exercises":[]}
  ]
}`,
	)
}

func buildOnboardingStructuredPlanJSON(input llm.OnboardingPlanInput, modeSpecificConstraints string, sampleJSON string) string {
	return fmt.Sprintf(
		`あなたは減量プラン設計AIです。以下条件に沿って、必ずJSONだけを返してください。説明文やMarkdownは不要です。

条件:
- 体重: %.1fkg
- 身長: %.1fcm
- 目標体重: %.1fkg
- 達成希望期間: %d%s
- 仕事: %s
- トレーニング環境: %s

制約:
- dayOfWeek は 0(日曜)〜6(土曜)
- dayType は TRAINING_DAY / CARDIO_DAY / HYBRID_DAY / REST_DAY のいずれか
- mealType は BREAKFAST / LUNCH / SNACK / POST_WORKOUT / DINNER のいずれか
- 数値は文字列でなく数値として返す
- 各 meal item の orderIndex は 0 から連番
- 現在体重・目標体重・期間から減量ペースを見積もり、無理のない範囲で1日の総摂取カロリーを設計する
- mealsByDayType の meal template 合計カロリーは、目標達成に向けた1日摂取カロリー設計と整合すること（大きく乖離させない）
- workoutsByDay は dayPlans の各曜日ごとに作成する（同じ TRAINING_DAY でも日ごとに内容を変える）
- workoutsByDay の dayOfWeek は重複禁止
- TRAINING_DAY / CARDIO_DAY / HYBRID_DAY の mealsByDayType には POST_WORKOUT を必ず1つ以上含める
- TRAINING_DAY / CARDIO_DAY / HYBRID_DAY の mealsByDayType には BREAKFAST / LUNCH / SNACK / POST_WORKOUT / DINNER を必ずすべて含める
- TRAINING_DAY の workoutsByDay は cardioDurationMinutes を必ず null にする
- TRAINING_DAY の exercises は「体幹のみ（プランク等のみ）」にしない
- HYBRID_DAY は「有酸素+筋トレ」の日として扱い、workoutsByDay で cardioDurationMinutes と exercises の両方を設定する
- REST_DAY の mealsByDayType は空配列にしない（最低でも BREAKFAST / LUNCH / DINNER を含める）
- mealsByDayType では同じ mealType を複数返してよい（例: BREAKFASTを2セット以上）
- あいまいな料理名（例: 和定食, 魚, 朝食）だけで終わらせず、具体的な料理名+食材内訳を返す
- BREAKFAST / LUNCH / DINNER の各 template は items を最低2件含める
- 各 item はできるだけ quantity, unit, calories を埋める（可能なら protein/fat/carbs も埋める）
- 週内でトレーニング内容に変化をつける（例: 胸/背中/下半身/全身、有酸素のみ日、有酸素+筋トレ日）
%s

返却JSONスキーマ:
%s`,
		input.WeightKg,
		input.HeightCm,
		input.TargetWeightKg,
		input.TargetDurationValue,
		durationLabel(input.TargetDurationUnit),
		input.Occupation,
		trainingModeLabel(input.TrainingMode),
		modeSpecificConstraints,
		sampleJSON,
	)
}

func durationLabel(unit string) string {
	if unit == "month" {
		return "ヶ月"
	}
	return "週間"
}

func trainingModeLabel(mode string) string {
	if mode == "BODYWEIGHT" {
		return "自重中心"
	}
	return "ジム中心"
}
