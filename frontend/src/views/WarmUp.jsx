import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { EXIDX } from '../lib/exercises.js'
import { beep, vibrate } from '../lib/sound.js'
import { t } from '../lib/i18n.js'
import { useWakeLock } from '../lib/wakelock.js'
import { buildRound, clock, MOVES, phaseAt, roundSeconds, skipTo, WORK_SEC, GAP_SEC } from '../lib/warmup.js'
import { startFlow } from '../sheets.jsx'
import Media from '../components/Media.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

const STEPS = buildRound()
const TOTAL = roundSeconds(STEPS)

// A ring instead of a bar: on a phone propped against a water bottle, the thing you can read
// mid-burpee from two metres away is a big number with a shrinking arc around it.
function Ring({ left, total, tone }) {
  const R = 78, C = 2 * Math.PI * R
  const frac = total ? Math.max(0, Math.min(1, left / total)) : 0
  return (
    <div className="wu-ring">
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <circle cx="90" cy="90" r={R} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset .25s linear' }} />
      </svg>
      <div className="wu-ring-n" style={{ color: tone }}>{Math.ceil(left)}</div>
    </div>
  )
}

export default function WarmUp() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  // Deadline-based, like the rest timer: a background tab that stops ticking still comes back
  // with the right time left instead of however many intervals the browser felt like running.
  const endsAt = useRef(0)
  const spoken = useRef(-1)

  const routine = effectiveRoutine(S, todayISO())
  const done = running && elapsed >= TOTAL
  const phase = running ? phaseAt(STEPS, elapsed) : null

  // The workout's own lock (held in App) covers a warm-up mid-session; don't take a second
  // one, because releasing it on unmount would drop the workout's too.
  useWakeLock(running && !done && !paused && S.keepAwake !== false && !S.active)

  useEffect(() => {
    if (!running || paused || done) return
    endsAt.current = Date.now() + (TOTAL - elapsed) * 1000
    const tick = () => setElapsed(Math.min(TOTAL, TOTAL - (endsAt.current - Date.now()) / 1000))
    const iv = setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', tick) }
  }, [running, paused, done])   // `elapsed` is read once per (re)start — a dep would reset the deadline every tick

  // Cues: a tick on the last three seconds of a phase, a double beep when the next one opens,
  // and a longer chord at the end of the round. Gated by the app's sound setting.
  useEffect(() => {
    if (!running) { spoken.current = -1; return }
    const snd = S.sound
    if (done) {
      if (spoken.current !== 'done') {
        spoken.current = 'done'
        beep(snd, 880, 0.15); beep(snd, 880, 0.15, 0.25); beep(snd, 1320, 0.4, 0.5)
        vibrate([200, 100, 200])
      }
      return
    }
    if (!phase) return
    const key = phase.i + ':' + Math.ceil(phase.left)
    if (spoken.current === key) return
    spoken.current = key
    const left = Math.ceil(phase.left)
    if (left === phase.step.sec) {            // a phase just opened
      if (phase.step.kind === 'work') { beep(snd, 880, 0.14); beep(snd, 1180, 0.2, 0.16); vibrate(120) }
      else if (phase.step.kind === 'gap') { beep(snd, 520, 0.18); vibrate(60) }
    } else if (left <= 3) beep(snd, 660, 0.09)
  }, [running, paused, done, phase?.i, Math.ceil(phase?.left ?? 0)])

  // The deadline is the source of truth for the clock, so anything that moves the playhead
  // has to move the deadline with it — setting `elapsed` alone would be overwritten by the
  // very next tick.
  const seek = to => { endsAt.current = Date.now() + (TOTAL - to) * 1000; setElapsed(to) }
  const start = () => { setElapsed(0); setPaused(false); setRunning(true) }
  const stop = () => { setRunning(false); setPaused(false); setElapsed(0) }
  const skip = () => seek(skipTo(STEPS, elapsed))
  const toWorkout = () => { if (routine && !S.active) startFlow(routine.id); else nav('/workout') }

  /* ---------- idle: what the round is, before committing to it ---------- */
  if (!running) return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <h1>{t('Warm-up')}</h1>
          <div className="sub">{t('{0} · {1} moves · moderate', clock(TOTAL), MOVES.length)}</div>
        </div>
        <button className="iconbtn" onClick={() => nav('/home')} aria-label={t('Close')}><Icon name="xmark" /></button>
      </div>

      <div className="card">
        <div className="row" style={{ gap: 10, marginBottom: 8 }}>
          <span className="lrow-i" style={{ background: 'var(--orange)' }}><Icon name="flame" /></span>
          <div>
            <div className="small dim" style={{ fontWeight: 500, letterSpacing: '.03em', textTransform: 'uppercase', fontSize: 11 }}>{t('Before you train')}</div>
            <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-.012em', marginTop: 2 }}>{t('Warm, not tired')}</div>
          </div>
        </div>
        <div className="small muted">
          {t('Six moves, {0} seconds each, {1} seconds between them. Keep it to a pace you could talk through — this is here to raise your temperature and wake the joints up, not to take anything out of the session that follows.', WORK_SEC, GAP_SEC)}
        </div>
      </div>

      <h4 className="sec">{t('The round')}</h4>
      <div className="list">
        {MOVES.map((m, i) => (
          <div key={m.id} className="item">
            <span className="lrow-i" style={{ background: 'var(--surface-3)', color: 'var(--label-2)' }}>{i + 1}</span>
            <div className="grow">
              <div className="tt">{m.n}</div>
              <div className="ss">{m.cue}</div>
            </div>
            <span className="tag">{WORK_SEC}s</span>
          </div>
        ))}
      </div>

      <div style={{ height: 14 }} />
      <Button variant="primary" icon="play" onClick={start}>{t('Start warm-up')}</Button>
    </div>
  )

  /* ---------- done ---------- */
  if (done) return (
    <div className="narrow wu-done">
      <div className="wu-badge"><Icon name="checkCircle" /></div>
      <h1>{t('Warm-up done')}</h1>
      <div className="muted">{t('Body’s up to temperature. Go and train.')}</div>
      <div style={{ height: 20 }} />
      <Button variant="primary" icon="dumbbell" onClick={toWorkout}>
        {S.active ? t('Back to workout') : routine ? t('Start {0}', routine.name) : t('Start workout')}
      </Button>
      <div style={{ height: 10 }} />
      <Button icon="reset" onClick={start}>{t('Another round')}</Button>
      <div style={{ height: 10 }} />
      <Button onClick={() => nav('/home')}>{t('Home')}</Button>
    </div>
  )

  /* ---------- running ---------- */
  const work = phase.step.kind === 'work'
  const lead = phase.step.kind === 'lead'
  const tone = work ? 'var(--acc)' : lead ? 'var(--label-2)' : 'var(--blue)'
  const move = work ? phase.step.move : phase.step.next
  const ex = work && phase.step.move.ex ? EXIDX[phase.step.move.ex] : null

  return (
    <div className="narrow wu-run">
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="small muted">{work ? t('{0} of {1}', phase.moveNo, MOVES.length) : lead ? t('Get ready') : t('Rest')}</div>
        <div className="small muted">{t('{0} left', clock(Math.ceil(phase.leftTotal)))}</div>
      </div>
      <div className="wu-total"><i style={{ width: (elapsed / TOTAL) * 100 + '%' }} /></div>

      <Ring left={phase.left} total={phase.step.sec} tone={tone} />

      <div className="wu-name" style={{ color: work ? 'var(--label)' : 'var(--label-2)' }}>
        {work ? move.n : lead ? t('Get ready') : t('Rest')}
      </div>
      <div className="wu-cue small muted">
        {work ? move.cue : t('Next: {0}', move.n)}
      </div>

      {ex ? <Media ex={ex} /> : (
        <div className="wu-glyph"><Icon name={work ? 'figureRun' : 'timer'} /></div>
      )}

      <div className="row" style={{ gap: 10, marginTop: 16 }}>
        <Button className="grow" icon={paused ? 'play' : 'pause'} onClick={() => setPaused(p => !p)}>
          {paused ? t('Resume') : t('Pause')}
        </Button>
        <Button className="grow" icon="chevronRight" onClick={skip}>{t('Skip')}</Button>
      </div>
      <div style={{ height: 10 }} />
      <Button onClick={stop}>{t('Stop')}</Button>
    </div>
  )
}
