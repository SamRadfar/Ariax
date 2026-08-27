// Pre-workout warm-up — a fixed 3-minute round of six moderate-intensity moves.
//
// The point is body temperature and joint prep, not fatigue: 20 s of work is long enough to
// raise the heart rate and short enough that nobody reaches failure, and the 10 s between
// moves is a transition, not a real rest — long enough to shake the legs out and read the
// next move, short enough that the heart rate never drops back to baseline.
//
// The arithmetic is deliberate. Six moves × 20 s = 120 s, five gaps × 10 s = 50 s, and a
// 10 s lead-in so the phone can be put down before the first jump: exactly 180 s. Reading
// the brief as "10 s of rest after the sixth move too" also gives 180 s, but it ends the
// round standing around instead of moving, so the lead-in got the ten seconds.
//
// `ex` is an id from the exercise library, used only to show that move's animation. Three
// of the six moves have no equivalent in the upstream dataset and deliberately carry no id
// rather than an approximation that would teach the wrong movement — those show the written
// cue instead.

export const WORK_SEC = 20
export const GAP_SEC = 10
export const LEAD_SEC = 10

export const MOVES = [
  {
    id: 'jumping-jacks',
    n: 'Jumping Jacks',
    ex: '3224',
    cue: 'Feet out and arms overhead, land soft. Steady rhythm you could hold a conversation over.'
  },
  {
    id: 'jump-squat',
    n: 'Jump Squat',
    ex: '0514',
    cue: 'Half-depth squat, small jump, absorb the landing with the knees. Height is not the point.'
  },
  {
    id: 'butt-kicks',
    n: 'Butt Kicks',
    ex: null,
    cue: 'Jog on the spot, heels flicking up to the glutes. Stay tall, quick feet, quiet landings.'
  },
  {
    id: 'burpee',
    n: 'Burpee',
    ex: '1160',
    cue: 'Hands down, feet back, step or hop in, stand up. Skip the push-up — this is a warm-up.'
  },
  {
    id: 'pop-squat',
    n: 'Pop Squat',
    ex: null,
    cue: 'Jump the feet wide into a squat, then jump them together. Low and rhythmic, not explosive.'
  },
  {
    id: 'shuffle',
    n: 'Shuffle',
    ex: null,
    cue: 'Athletic stance, short lateral steps side to side. Chest up, hips low, feet never crossing.'
  }
]

// One round as a flat list of phases: { kind, sec, at, move, next }.
// `at` is the offset from the start of the round, so a single elapsed-seconds value locates
// the phase without accumulating per-tick drift.
export function buildRound(moves = MOVES) {
  const steps = []
  let at = 0
  const push = step => { steps.push({ ...step, at }); at += step.sec }
  push({ kind: 'lead', sec: LEAD_SEC, move: null, next: moves[0] })
  moves.forEach((move, i) => {
    push({ kind: 'work', sec: WORK_SEC, move, next: moves[i + 1] || null })
    if (i < moves.length - 1) push({ kind: 'gap', sec: GAP_SEC, move, next: moves[i + 1] })
  })
  return steps
}

export const roundSeconds = (steps = buildRound()) =>
  steps.reduce((sum, s) => sum + s.sec, 0)

// Where `elapsed` seconds into the round lands. Returns null once the round is over, so the
// caller's "done" branch is a null check rather than a comparison it could get wrong.
export function phaseAt(steps, elapsed) {
  const total = roundSeconds(steps)
  if (elapsed < 0) elapsed = 0
  if (elapsed >= total) return null
  const i = steps.findIndex(s => elapsed < s.at + s.sec)
  const step = steps[i]
  return {
    i,
    step,
    left: step.at + step.sec - elapsed,       // seconds remaining in this phase
    leftTotal: total - elapsed,               // seconds remaining in the round
    // 1-based index among the work phases, for "3 / 6"
    moveNo: steps.slice(0, i + 1).filter(s => s.kind === 'work').length
  }
}

// Elapsed seconds at the start of the next phase — what a Skip button jumps to.
export const skipTo = (steps, elapsed) => {
  const p = phaseAt(steps, elapsed)
  return p ? p.step.at + p.step.sec : roundSeconds(steps)
}

export const clock = sec => Math.floor(sec / 60) + ':' + String(Math.max(0, sec) % 60).padStart(2, '0')
