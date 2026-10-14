// 穴の「意味」ごとの色と線の種類。同じ意味なら、式が違っても同じ色・同じ線にする。
// 色の値は theme.css の --role-*(背景に対して 3:1 以上)。
export type Role = 'size' | 'stretch' | 'shift-x' | 'shift-y'

export type RoleStyle = {
  color: string
  width: number
  dash: string | undefined
  meaning: string
}

export const roleStyles: Record<Role, RoleStyle> = {
  size: { color: 'var(--role-size)', width: 2.5, dash: undefined, meaning: '大きさ・傾き' },
  stretch: { color: 'var(--role-stretch)', width: 2.5, dash: '8 4', meaning: '横の伸び縮み' },
  'shift-x': { color: 'var(--role-shift-x)', width: 3, dash: '2 5', meaning: '横の移動' },
  'shift-y': { color: 'var(--role-shift-y)', width: 2.5, dash: '9 4 2 4', meaning: '縦の移動' },
}
