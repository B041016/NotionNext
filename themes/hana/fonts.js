export const FONT_CHOICES = [
  { id: 'xiaolai', label: '小赖字体', family: 'HanaXiaolai' },
  { id: 'shanhai', label: '山海夏日烟火', family: 'HanaShanhai' },
  { id: 'system', label: '系统字体', family: null }
]
export function normalizeFont(value, fallback = 'xiaolai') {
  if (FONT_CHOICES.some(font => font.id === value)) return value
  return FONT_CHOICES.some(font => font.id === fallback) ? fallback : 'xiaolai'
}
