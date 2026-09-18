interface Props { simulationTime: number; isRunning: boolean }
function formatTime(minutes: number): string { const h = Math.floor(minutes / 60); const m = minutes % 60; return h === 0 ? `T+${m.toString().padStart(2, '0')} MIN` : `T+${h}H ${m.toString().padStart(2, '0')} MIN` }
export function Header({ simulationTime, isRunning }: Props) {
  return <header className="site-header"><div className="site-header-inner"><div><span className="brand-mark">SI—02</span><span className="brand-sub">TABLET MANUFACTURING / DIGITAL TWIN</span></div><div className="header-clock"><i className={isRunning ? 'animate-pulse' : ''} /><span>SIMULATION CLOCK</span><strong>{formatTime(simulationTime)}</strong></div><div className="header-status">LINE STATUS <span>● {isRunning ? 'LIVE' : 'STANDBY'}</span></div></div></header>
}
