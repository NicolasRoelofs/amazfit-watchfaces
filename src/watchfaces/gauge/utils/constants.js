const lang = DeviceRuntimeCore.HmUtils.getLanguage()
const isRusLang = ['ru-RU', 'uk-UA'].includes(lang)
export const isFrLang = lang === 'fr-FR'

const { width, height } = hmSetting.getDeviceInfo()

export const SCREEN = {
  centerX: width / 2,
  centerY: height / 2,
}

const WEEKDAY_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const WEEKDAY_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
const WEEKDAY_FR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export const WEEKDAYS = isRusLang
  ? WEEKDAY_RU
  : isFrLang
    ? WEEKDAY_FR
    : WEEKDAY_EN

export const HEART_TEXT = isRusLang
  ? 'ЧСС %s'
  : isFrLang
    ? '%s BPM'
    : '%s BPM'

export const SLEEP_TEXT = isRusLang
  ? 'СОН %s'
  : isFrLang
    ? 'SOMMEIL %s'
    : 'SLEEP %s'

const STEPS_POSTFIX_RU = ['шаг', 'шага', 'шагов']
const STEPS_POSTFIX_EN = ['step', 'steps', 'steps']
const STEPS_POSTFIX_FR = ['pas', 'pas', 'pas']

export const STEPS_POSTFIX = isRusLang
  ? STEPS_POSTFIX_RU
  : isFrLang
    ? STEPS_POSTFIX_FR
    : STEPS_POSTFIX_EN
