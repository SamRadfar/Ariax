import { describe, expect, it } from 'vitest'
import reference from '../locales/es.js'
import persian from '../locales/fa.js'
import { dateLocale, directionFor, getLang, setLang, t } from './i18n.js'

const placeholders = value => [...value.matchAll(/\{\d+\}/g)].map(match => match[0]).sort()

describe('Persian locale', () => {
  it('covers every translated UI key with matching placeholders', () => {
    expect(Object.keys(persian).sort()).toEqual(Object.keys(reference).sort())
    for (const key of Object.keys(reference)) {
      expect(placeholders(persian[key]), key).toEqual(placeholders(key))
    }
  })

  it('loads as fa-IR with right-to-left direction', async () => {
    await setLang('fa')

    expect(getLang()).toBe('fa')
    expect(dateLocale()).toBe('fa-IR')
    expect(directionFor(getLang())).toBe('rtl')
    expect(t('Settings')).toBe('تنظیمات')
  })
})
