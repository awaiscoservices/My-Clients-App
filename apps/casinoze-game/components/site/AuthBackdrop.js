import { GAME_CATALOG } from '../../lib/gameCatalog'

// Quiet animated background for login / register / password pages: drifting game logos, kept dim so the form stays the focus.
const SPOTS = [[4, 8, -9, 0], [86, 6, 8, 1], [8, 62, 7, 2], [88, 58, -7, 3], [20, 86, -4, 4], [74, 88, 6, 5]]
export default function AuthBackdrop() {
  return (
    <div className="ab" aria-hidden="true">
      <svg className="ab-rings" viewBox="0 0 800 800"><g fill="none" stroke="#fbbf24"><circle cx="400" cy="400" r="190" opacity=".1" /><circle cx="400" cy="400" r="290" opacity=".07" strokeDasharray="3 9" /><circle cx="400" cy="400" r="390" opacity=".05" /></g></svg>
      {SPOTS.map(([x, y, r, i]) => {
        const g = GAME_CATALOG[(i * 4 + 1) % GAME_CATALOG.length]
        return <div key={i} className="ab-card" style={{ left: `${x}%`, top: `${y}%`, '--r': `${r}deg`, '--d': `${7 + i}s`, background: `linear-gradient(165deg,${g.tint[0]},${g.tint[1]})` }}><img src={g.src} alt="" /></div>
      })}
      <div className="ab-vig" />
      <style>{`
        .ab{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--bg-gradient)}
        .ab-rings{position:absolute;left:50%;top:50%;width:min(1100px,150vw);transform:translate(-50%,-50%);animation:abSpin 90s linear infinite}
        .ab-card{position:absolute;width:112px;height:128px;border-radius:20px;padding:12px;opacity:.5;border:1px solid rgba(255,255,255,.12);transform:rotate(var(--r));animation:abFloat var(--d) ease-in-out infinite;box-shadow:0 18px 40px rgba(0,0,0,.4)}
        .ab-card img{width:100%;height:100%;object-fit:contain}
        .ab-vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(7,10,18,0) 18%,rgba(7,10,18,.88) 78%)}
        @keyframes abSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes abFloat{0%,100%{transform:rotate(var(--r)) translateY(0)}50%{transform:rotate(var(--r)) translateY(-16px)}}
        @media(max-width:700px){.ab-card:nth-of-type(n+4){display:none}.ab-card{width:84px;height:96px;opacity:.38}}
        @media(prefers-reduced-motion:reduce){.ab-rings,.ab-card{animation:none}}
      `}</style>
    </div>
  )
}
