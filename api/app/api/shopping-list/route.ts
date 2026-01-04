import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStartParam = searchParams.get('weekStart')
    const userId = searchParams.get('userId') || '1' // MVP: 固定ユーザー

    // 今週の月曜日を計算
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 月曜日までの日数
    const weekStart = weekStartParam
      ? new Date(weekStartParam)
      : new Date(today.getTime() + diff * 24 * 60 * 60 * 1000)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // 既存のShoppingListを取得または作成
    let shoppingList = await prisma.shoppingList.findUnique({
      where: {
        userId_weekStart: {
          userId: userId,
          weekStart: weekStart,
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    })

    if (!shoppingList) {
      // 週のDayPlanを取得
      const dayPlans = await prisma.dayPlan.findMany({
        where: {
          plan: {
            userId: userId,
          },
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          mealPlan: {
            include: {
              mealTemplate: {
                include: {
                  items: {
                    include: {
                      ingredients: {
                        include: {
                          ingredient: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      // 食材を集計
      const ingredientMap = new Map<
        string,
        { ingredient: any; quantity: number; unit: string }
      >()

      for (const dayPlan of dayPlans) {
        if (dayPlan.mealPlan?.mealTemplate.items) {
          for (const item of dayPlan.mealPlan.mealTemplate.items) {
            for (const mealItemIngredient of item.ingredients) {
              const ing = mealItemIngredient.ingredient
              const key = `${ing.id}_${ing.unit}`
              const existing = ingredientMap.get(key)

              if (existing) {
                existing.quantity += mealItemIngredient.quantity
              } else {
                ingredientMap.set(key, {
                  ingredient: ing,
                  quantity: mealItemIngredient.quantity,
                  unit: mealItemIngredient.unit,
                })
              }
            }
          }
        }
      }

      // ShoppingListを作成
      shoppingList = await prisma.shoppingList.create({
        data: {
          userId: userId,
          weekStart: weekStart,
          weekEnd: weekEnd,
          items: {
            create: Array.from(ingredientMap.values()).map((item) => ({
              ingredientId: item.ingredient.id,
              quantity: item.quantity,
              unit: item.unit,
              purchased: false,
            })),
          },
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      })
    }

    // カテゴリ別にグループ化
    const categorized = {
      PROTEIN: [] as any[],
      VEGETABLE: [] as any[],
      CARB: [] as any[],
      OTHER: [] as any[],
    }

    for (const item of shoppingList.items) {
      const category = item.ingredient.category as keyof typeof categorized
      if (categorized[category]) {
        categorized[category].push({
          id: item.id,
          ingredientName: item.ingredient.name,
          quantity: item.quantity,
          unit: item.unit,
          purchased: item.purchased,
        })
      } else {
        categorized.OTHER.push({
          id: item.id,
          ingredientName: item.ingredient.name,
          quantity: item.quantity,
          unit: item.unit,
          purchased: item.purchased,
        })
      }
    }

    return NextResponse.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      items: categorized,
    })
  } catch (error) {
    console.error('Error fetching shopping list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { itemId, purchased } = body

    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { purchased },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating shopping list item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

