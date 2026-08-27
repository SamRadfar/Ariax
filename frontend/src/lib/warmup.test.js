import { describe, expect, it } from 'vitest'
import { buildRound, clock, GAP_SEC, LEAD_SEC, MOVES, phaseAt, roundSeconds, skipTo, WORK_SEC } from './warmup.js'

const steps = buildRound()

describe('warm-up round', () => {
  it('is exactly three minutes', () => {
    expect(roundSeconds(steps)).toBe(180)
  })

  it('runs six moves with a gap between them and none after the last', () => {
    const work = steps.filter(s => s.kind === 'work')
    const gaps = steps.filter(s => s.kind === 'gap')
    expect(work.map(s => s.move.n)).toEqual([
      'Jumping Jacks', 'Jump Squat', 'Butt Kicks', 'Burpee', 'Pop Squat', 'Shuffle'
    ])
    expect(gaps).toHaveLength(MOVES.length - 1)
    expect(steps[0].kind).toBe('lead')
    expect(steps[steps.length - 1].kind).toBe('work')
    expect(work.every(s => s.sec === WORK_SEC)).toBe(true)
    expect(gaps.every(s => s.sec === GAP_SEC)).toBe(true)
  })

  it('lays the phases out back to back', () => {
    steps.forEach((s, i) => {
      if (i) expect(s.at).toBe(steps[i - 1].at + steps[i - 1].sec)
    })
  })

  it('locates the phase for a given elapsed time', () => {
    expect(phaseAt(steps, 0).step.kind).toBe('lead')
    expect(phaseAt(steps, 0).left).toBe(LEAD_SEC)
    // first work phase starts the instant the lead-in ends
    expect(phaseAt(steps, LEAD_SEC).step.move.n).toBe('Jumping Jacks')
    expect(phaseAt(steps, LEAD_SEC).moveNo).toBe(1)
    expect(phaseAt(steps, LEAD_SEC + WORK_SEC).step.kind).toBe('gap')
    // last second of the round is still the sixth move
    expect(phaseAt(steps, 179).step.move.n).toBe('Shuffle')
    expect(phaseAt(steps, 179).moveNo).toBe(6)
    expect(phaseAt(steps, 179).leftTotal).toBe(1)
  })

  it('reports the round as over only once it is', () => {
    expect(phaseAt(steps, 179.5)).not.toBeNull()
    expect(phaseAt(steps, 180)).toBeNull()
    expect(phaseAt(steps, 999)).toBeNull()
  })

  it('skips to the start of the next phase, and off the end from the last', () => {
    expect(skipTo(steps, 0)).toBe(LEAD_SEC)
    expect(skipTo(steps, LEAD_SEC + 5)).toBe(LEAD_SEC + WORK_SEC)
    expect(skipTo(steps, 175)).toBe(180)
  })

  it('formats the clock', () => {
    expect(clock(180)).toBe('3:00')
    expect(clock(9)).toBe('0:09')
    expect(clock(0)).toBe('0:00')
  })
})
