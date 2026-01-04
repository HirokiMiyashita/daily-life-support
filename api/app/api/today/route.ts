import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const userId = searchParams.get('userId') || '1' // MVP: 固定ユーザー

    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // 今日のDayPlanを取得（なければ作成）
    let dayPlan = await prisma.dayPlan.findFirst({
      where: {
        date: targetDate,
        plan: {
          userId: userId,
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
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
        },
        workoutPlan: {
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
            exerciseLogs: {
              include: {
                exerciseTemplate: true,
              },
            },
          },
        },
        todoItems: {
          include: {
            todoTemplate: true,
          },
          orderBy: {
            todoTemplate: {
              order: 'asc',
            },
          },
        },
      },
    })

    // DayPlanが存在しない場合は、デフォルトのプランを作成
    if (!dayPlan) {
      // まずPlanを取得または作成
      let plan = await prisma.plan.findFirst({
        where: { userId: userId },
      })

      if (!plan) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        plan = await prisma.plan.create({
          data: {
            userId: userId,
            startDate: new Date(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 半年後
            targetWeight: user.weight ? user.weight - 20 : 56,
            currentWeight: user.weight || 76,
          },
        })
      }

      // DayPlanを作成
      dayPlan = await prisma.dayPlan.create({
        data: {
          planId: plan.id,
          date: targetDate,
          dayType: getDayType(dayOfWeek),
          dayOfWeek: dayOfWeek,
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
                    orderBy: {
                      order: 'asc',
                    },
                  },
                },
              },
            },
          },
          workoutPlan: {
            include: {
              workoutTemplate: {
                include: {
                  exercises: {
                    orderBy: {
                      order: 'asc',
                    },
                  },
                },
              },
              exerciseLogs: {
                include: {
                  exerciseTemplate: true,
                },
              },
            },
          },
          todoItems: {
            include: {
              todoTemplate: true,
            },
            orderBy: {
              todoTemplate: {
                order: 'asc',
              },
            },
          },
        },
      })
    }

    // 目標サマリを計算
    const goals = calculateGoals(dayPlan.dayType)

    return NextResponse.json({
      date: date,
      dayOfWeek: dayOfWeek,
      dayType: dayPlan.dayType,
      todos: dayPlan.todoItems.map((item) => ({
        id: item.id,
        name: item.todoTemplate.name,
        description: item.todoTemplate.description,
        time: item.todoTemplate.time,
        completed: item.completed,
        completedAt: item.completedAt,
      })),
      meals: dayPlan.mealPlan
        ? {
            template: dayPlan.mealPlan.mealTemplate.name,
            items: dayPlan.mealPlan.mealTemplate.items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              calories: item.calories,
              protein: item.protein,
              fat: item.fat,
              carbs: item.carbs,
            })),
          }
        : null,
      workout: dayPlan.workoutPlan
        ? {
            name: dayPlan.workoutPlan.workoutTemplate.name,
            type: dayPlan.workoutPlan.workoutTemplate.workoutType,
            cardioMinutes: dayPlan.workoutPlan.workoutTemplate.cardioMinutes,
            cardioIntensity: dayPlan.workoutPlan.workoutTemplate.cardioIntensity,
            exercises: dayPlan.workoutPlan.workoutTemplate.exercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets,
              repsMin: ex.repsMin,
              repsMax: ex.repsMax,
              weight: ex.weight,
              notes: ex.notes,
            })),
            completed: dayPlan.workoutPlan.completed,
          }
        : null,
      goals: goals,
    })
  } catch (error) {
    console.error('Error fetching today data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDayType(dayOfWeek: number): string {
  // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  if (dayOfWeek === 0) return 'REST_DAY' // 日曜
  if (dayOfWeek === 3) return 'CARDIO_DAY' // 水曜
  if (dayOfWeek === 6) return 'REST_DAY' // 土曜
  return 'TRAINING_DAY' // 月火木金
}

function calculateGoals(dayType: string) {
  if (dayType === 'TRAINING_DAY') {
    return {
      calories: { min: 1450, max: 1550 },
      protein: 130, // g
      fat: 40, // g (上限)
      carbs: null, // 昼＋トレ後中心
      steps: 8000,
      sleep: 7.5, // 時間
    }
  } else if (dayType === 'CARDIO_DAY') {
    return {
      calories: { min: 1300, max: 1400 },
      protein: 120,
      fat: 35,
      carbs: null,
      steps: 10000,
      sleep: 7.5,
    }
  } else {
    // REST_DAY
    return {
      calories: { min: 1300, max: 1300 },
      protein: 110,
      fat: 30,
      carbs: null,
      steps: 5000,
      sleep: 8,
    }
  }
}

