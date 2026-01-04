import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 シードデータの投入を開始します...')

  // ユーザーを作成
  const user = await prisma.user.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      age: 26,
      height: 158,
      weight: 76,
      bodyType: '筋肉質 / 固太り',
    },
  })

  console.log('✅ ユーザーを作成しました')

  // プランを作成
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 6)

  const plan = await prisma.plan.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      userId: user.id,
      startDate: startDate,
      endDate: endDate,
      targetWeight: 56, // 76kg - 20kg
      currentWeight: 76,
    },
  })

  console.log('✅ プランを作成しました')

  // 食材マスタを作成
  const ingredients = [
    // タンパク質
    { name: '鶏むね', category: 'PROTEIN', unit: 'g', caloriesPerUnit: 1.65, proteinPerUnit: 0.23, fatPerUnit: 0.04 },
    { name: '鶏もも（皮なし）', category: 'PROTEIN', unit: 'g', caloriesPerUnit: 1.5, proteinPerUnit: 0.2, fatPerUnit: 0.05 },
    { name: '鮭', category: 'PROTEIN', unit: 'piece', caloriesPerUnit: 200, proteinPerUnit: 25, fatPerUnit: 10 },
    { name: 'サバ', category: 'PROTEIN', unit: 'piece', caloriesPerUnit: 250, proteinPerUnit: 20, fatPerUnit: 18 },
    { name: '赤身肉', category: 'PROTEIN', unit: 'g', caloriesPerUnit: 2.5, proteinPerUnit: 0.26, fatPerUnit: 0.15 },
    { name: '卵', category: 'PROTEIN', unit: 'piece', caloriesPerUnit: 70, proteinPerUnit: 6, fatPerUnit: 5 },
    { name: 'プロテイン', category: 'PROTEIN', unit: 'serving', caloriesPerUnit: 100, proteinPerUnit: 20, fatPerUnit: 1 },
    { name: '豆腐', category: 'PROTEIN', unit: 'piece', caloriesPerUnit: 80, proteinPerUnit: 7, fatPerUnit: 4 },
    { name: '納豆', category: 'PROTEIN', unit: 'pack', caloriesPerUnit: 100, proteinPerUnit: 8, fatPerUnit: 5 },
    { name: 'ギリシャヨーグルト', category: 'PROTEIN', unit: 'g', caloriesPerUnit: 0.6, proteinPerUnit: 0.1, fatPerUnit: 0.03 },
    // 野菜
    { name: '冷凍ブロッコリー', category: 'VEGETABLE', unit: 'bag', caloriesPerUnit: 50, proteinPerUnit: 5, fatPerUnit: 0.5 },
    { name: 'キャベツ', category: 'VEGETABLE', unit: 'piece', caloriesPerUnit: 200, proteinPerUnit: 5, fatPerUnit: 1 },
    // 糖質
    { name: '白米（炊飯後）', category: 'CARB', unit: 'g', caloriesPerUnit: 1.68, proteinPerUnit: 0.03, fatPerUnit: 0.003 },
    { name: 'バナナ', category: 'CARB', unit: 'piece', caloriesPerUnit: 80, proteinPerUnit: 1, fatPerUnit: 0.3 },
    // その他
    { name: '味噌汁', category: 'OTHER', unit: 'serving', caloriesPerUnit: 30, proteinPerUnit: 2, fatPerUnit: 1 },
  ]

  const ingredientMap = new Map()
  for (const ing of ingredients) {
    const created = await prisma.ingredient.upsert({
      where: { name_unit: { name: ing.name, unit: ing.unit } },
      update: {},
      create: ing,
    })
    ingredientMap.set(ing.name, created)
  }

  console.log('✅ 食材マスタを作成しました')

  // 食事テンプレートを作成
  const mealTemplates = [
    {
      name: '朝食',
      mealType: 'BREAKFAST',
      calories: 200,
      caloriesMax: 250,
      protein: 20,
      items: [
        { name: 'プロテイン 1杯', quantity: 1, unit: 'serving', calories: 100, protein: 20, fat: 1 },
        { name: 'ギリシャヨーグルト100g', quantity: 100, unit: 'g', calories: 60, protein: 10, fat: 3 },
      ],
    },
    {
      name: '昼食',
      mealType: 'LUNCH',
      calories: 500,
      caloriesMax: 550,
      protein: 50,
      items: [
        { name: '鶏むね 200g', quantity: 200, unit: 'g', calories: 330, protein: 46, fat: 8 },
        { name: '白米 100g（炊飯後）', quantity: 100, unit: 'g', calories: 168, protein: 3, carbs: 37 },
        { name: '野菜 両手2杯', quantity: 1, unit: 'serving', calories: 50, protein: 2, carbs: 10 },
        { name: '味噌汁', quantity: 1, unit: 'serving', calories: 30, protein: 2, fat: 1 },
      ],
    },
    {
      name: '間食',
      mealType: 'SNACK',
      calories: 100,
      caloriesMax: 150,
      protein: 20,
      items: [
        { name: 'プロテイン 1杯', quantity: 1, unit: 'serving', calories: 100, protein: 20, fat: 1 },
      ],
    },
    {
      name: 'トレ後',
      mealType: 'POST_WORKOUT',
      calories: 150,
      caloriesMax: 200,
      protein: 20,
      items: [
        { name: 'プロテイン 1杯', quantity: 1, unit: 'serving', calories: 100, protein: 20, fat: 1 },
        { name: 'バナナ 半分', quantity: 0.5, unit: 'piece', calories: 40, carbs: 10 },
      ],
    },
    {
      name: '夕食',
      mealType: 'DINNER',
      calories: 400,
      caloriesMax: 450,
      protein: 40,
      items: [
        { name: '魚（鮭/サバ）150g', quantity: 1, unit: 'piece', calories: 200, protein: 25, fat: 10 },
        { name: '豆腐 1丁', quantity: 1, unit: 'piece', calories: 80, protein: 7, fat: 4 },
        { name: '野菜 両手2杯', quantity: 1, unit: 'serving', calories: 50, protein: 2, carbs: 10 },
      ],
    },
  ]

  const mealTemplateMap = new Map()
  for (const template of mealTemplates) {
    const { items, ...templateData } = template
    const created = await prisma.mealTemplate.upsert({
      where: { id: template.name },
      update: {},
      create: templateData,
    })

    // 既存のアイテムを削除
    await prisma.mealItem.deleteMany({
      where: { mealTemplateId: created.id },
    })

    // アイテムを作成
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const mealItem = await prisma.mealItem.create({
        data: {
          mealTemplateId: created.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          order: i,
        },
      })

      // 食材との紐付け（簡易版：名前でマッチング）
      if (item.name.includes('プロテイン')) {
        const ing = ingredientMap.get('プロテイン')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 1,
              unit: item.unit || 'serving',
            },
          })
        }
      } else if (item.name.includes('鶏むね')) {
        const ing = ingredientMap.get('鶏むね')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 200,
              unit: item.unit || 'g',
            },
          })
        }
      } else if (item.name.includes('白米')) {
        const ing = ingredientMap.get('白米（炊飯後）')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 100,
              unit: item.unit || 'g',
            },
          })
        }
      } else if (item.name.includes('バナナ')) {
        const ing = ingredientMap.get('バナナ')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 0.5,
              unit: item.unit || 'piece',
            },
          })
        }
      } else if (item.name.includes('魚') || item.name.includes('鮭') || item.name.includes('サバ')) {
        const ing = ingredientMap.get('鮭')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 1,
              unit: item.unit || 'piece',
            },
          })
        }
      } else if (item.name.includes('豆腐')) {
        const ing = ingredientMap.get('豆腐')
        if (ing) {
          await prisma.mealItemIngredient.create({
            data: {
              mealItemId: mealItem.id,
              ingredientId: ing.id,
              quantity: item.quantity || 1,
              unit: item.unit || 'piece',
            },
          })
        }
      }
    }

    mealTemplateMap.set(template.name, created)
  }

  console.log('✅ 食事テンプレートを作成しました')

  // ワークアウトテンプレートを作成（曜日別）
  const workoutTemplates = [
    {
      dayOfWeek: 1, // 月
      name: '下半身①（重め）',
      workoutType: 'TRAINING',
      cardioMinutes: 30,
      cardioIntensity: '傾斜ウォーク 30分（速度4.5〜5.5 / 傾斜8〜12）',
      exercises: [
        { name: 'レッグプレス', sets: 4, repsMin: 8, repsMax: 12, order: 0, notes: 'RIR2' },
        { name: 'ルーマニアンデッドリフト', sets: 3, repsMin: 8, repsMax: 10, order: 1, notes: 'RIR2' },
        { name: 'レッグカール', sets: 3, repsMin: 10, repsMax: 15, order: 2 },
        { name: 'カーフレイズ', sets: 3, repsMin: 12, repsMax: 20, order: 3 },
      ],
    },
    {
      dayOfWeek: 2, // 火
      name: 'Push（胸・肩・腕）',
      workoutType: 'TRAINING',
      cardioMinutes: 15,
      cardioIntensity: '傾斜ウォーク 15〜20分',
      exercises: [
        { name: 'チェストプレス', sets: 4, repsMin: 8, repsMax: 12, order: 0, notes: 'RIR2' },
        { name: 'ショルダープレス', sets: 3, repsMin: 8, repsMax: 12, order: 1, notes: 'RIR2' },
        { name: 'サイドレイズ', sets: 3, repsMin: 12, repsMax: 20, order: 2 },
        { name: 'トライセプスプレスダウン', sets: 3, repsMin: 10, repsMax: 15, order: 3 },
      ],
    },
    {
      dayOfWeek: 3, // 水
      name: '有酸素Day',
      workoutType: 'CARDIO',
      cardioMinutes: 45,
      cardioIntensity: '傾斜ウォーク or クロストレーナー 45〜60分（会話できる強度）',
      exercises: [
        { name: '有酸素運動', sets: 1, repsMin: 45, repsMax: 60, order: 0, notes: '会話できる強度' },
        { name: 'プランク', sets: 3, repsMin: 40, repsMax: 40, order: 1, notes: '40秒 × 3' },
        { name: '腹筋マシン(orアブローラー)', sets: 3, repsMin: 12, repsMax: 12, order: 2 },
        { name: 'ストレッチ', sets: 1, repsMin: 10, repsMax: 10, order: 3, notes: '股関節/背中 10分' },
      ],
    },
    {
      dayOfWeek: 4, // 木
      name: 'Pull（背中）',
      workoutType: 'TRAINING',
      cardioMinutes: 15,
      cardioIntensity: '傾斜ウォーク 15〜20分',
      exercises: [
        { name: 'ラットプルダウン', sets: 4, repsMin: 8, repsMax: 12, order: 0, notes: 'RIR2' },
        { name: 'シーテッドロー', sets: 3, repsMin: 8, repsMax: 12, order: 1, notes: 'RIR2' },
        { name: 'フェイスプル', sets: 3, repsMin: 12, repsMax: 20, order: 2 },
        { name: 'バックエクステンション', sets: 3, repsMin: 10, repsMax: 15, order: 3 },
      ],
    },
    {
      dayOfWeek: 5, // 金
      name: '下半身②（ボリューム）',
      workoutType: 'TRAINING',
      cardioMinutes: 30,
      cardioIntensity: '傾斜ウォーク 30分',
      exercises: [
        { name: 'ブルガリアンスクワット', sets: 3, repsMin: 10, repsMax: 10, order: 0 },
        { name: 'レッグエクステンション', sets: 3, repsMin: 12, repsMax: 15, order: 1 },
        { name: 'ヒップスラスト', sets: 3, repsMin: 10, repsMax: 12, order: 2 },
        { name: 'カーフレイズ', sets: 3, repsMin: 15, repsMax: 15, order: 3 },
      ],
    },
  ]

  for (const template of workoutTemplates) {
    const { exercises, ...templateData } = template
    const created = await prisma.workoutTemplate.upsert({
      where: { dayOfWeek: template.dayOfWeek },
      update: {},
      create: templateData,
    })

    // 既存のエクササイズを削除
    await prisma.exerciseTemplate.deleteMany({
      where: { workoutTemplateId: created.id },
    })

    // エクササイズを作成
    for (const exercise of exercises) {
      await prisma.exerciseTemplate.create({
        data: {
          workoutTemplateId: created.id,
          ...exercise,
        },
      })
    }
  }

  console.log('✅ ワークアウトテンプレートを作成しました')

  // Todoテンプレートを作成
  const todoTemplates = [
    // 毎日共通
    { name: '朝の体重測定', description: '07:30', category: 'DAILY', time: '07:30', order: 0 },
    { name: '水を飲む', description: '起床後', category: 'DAILY', time: '07:30', order: 1 },
    { name: '朝食', description: '07:40', category: 'DAILY', time: '07:40', order: 2 },
    { name: '昼食', description: '12:00', category: 'DAILY', time: '12:00', order: 3 },
    { name: '食後散歩15分', description: '12:20', category: 'DAILY', time: '12:20', order: 4 },
    { name: '間食', description: '15:30', category: 'DAILY', time: '15:30', order: 5 },
    { name: '歩数目標達成', description: '8,000歩', category: 'DAILY', time: null, order: 6 },
    { name: '風呂後ストレッチ', description: '21:30', category: 'DAILY', time: '21:30', order: 7 },
    { name: '就寝', description: '23:30', category: 'DAILY', time: '23:30', order: 8 },
    // トレ日追加
    { name: 'ジム：筋トレ', description: '18:30〜', category: 'TRAINING_DAY', time: '18:30', order: 0 },
    { name: 'ジム：有酸素', description: '20〜30分', category: 'TRAINING_DAY', time: '19:00', order: 1 },
    { name: 'トレ後プロテイン＋糖質', description: '20:00', category: 'TRAINING_DAY', time: '20:00', order: 2 },
    { name: '夕食', description: '20:30', category: 'TRAINING_DAY', time: '20:30', order: 3 },
    // 有酸素Day
    { name: '有酸素45〜60分', description: '', category: 'CARDIO_DAY', time: '18:30', order: 0 },
    { name: '体幹（プランク/腹筋）', description: '', category: 'CARDIO_DAY', time: '19:30', order: 1 },
    { name: 'ストレッチ10分', description: '', category: 'CARDIO_DAY', time: '20:00', order: 2 },
  ]

  for (const template of todoTemplates) {
    await prisma.todoTemplate.upsert({
      where: { id: template.name },
      update: {},
      create: template,
    })
  }

  console.log('✅ Todoテンプレートを作成しました')
  console.log('🎉 シードデータの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

