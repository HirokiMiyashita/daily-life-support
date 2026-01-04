const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const api = {
  async getToday(date?: string) {
    const url = new URL(`${API_BASE_URL}/api/today`)
    if (date) {
      url.searchParams.set('date', date)
    }
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Failed to fetch today data')
    }
    return response.json()
  },

  async getShoppingList(weekStart?: string) {
    const url = new URL(`${API_BASE_URL}/api/shopping-list`)
    if (weekStart) {
      url.searchParams.set('weekStart', weekStart)
    }
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Failed to fetch shopping list')
    }
    return response.json()
  },

  async updateShoppingListItem(itemId: string, purchased: boolean) {
    const response = await fetch(`${API_BASE_URL}/api/shopping-list`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, purchased }),
    })
    if (!response.ok) {
      throw new Error('Failed to update shopping list item')
    }
    return response.json()
  },
}

