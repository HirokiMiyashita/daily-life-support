package prompt

import "fmt"

func BuildExerciseReferenceVideoPrompt(exerciseName string) string {
	return fmt.Sprintf(`あなたは筋トレ種目の動画レコメンドAIです。
以下の種目について、日本語話者向けのフォーム解説動画をYouTubeから1件だけ提案してください。

種目名: %s

制約:
- 必ずYouTubeの動画URLを返す（youtube.com/watch?v=... または youtu.be/...）
- Shortsは避ける
- 日本語の解説動画を優先
- 出力は必ずJSONのみ

JSON形式:
{"title":"動画タイトル","youtubeUrl":"https://www.youtube.com/watch?v=VIDEO_ID"}`, exerciseName)
}
