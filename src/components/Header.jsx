export default function Header({ step, onLogoClick }) {
  return <header className="site-header"><button className="brand" onClick={onLogoClick}><span className="brand-mark">✦</span><span>tripmore<span>.in</span></span></button><div className="secure"><span>●</span> Secure booking</div><div className="progress" aria-label={`Step ${step} of 3`}><i className={step >= 1 ? 'active' : ''}/><i className={step >= 2 ? 'active' : ''}/><i className={step >= 3 ? 'active' : ''}/></div></header>
}
