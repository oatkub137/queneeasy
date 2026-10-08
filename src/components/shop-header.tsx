import { Link } from '@tanstack/react-router';
import { ThemeControl } from '@/components/theme-control';
import logo from '@/assets/airiix-logo.jpeg.asset.json';

export function ShopHeader({ children }: { children?: React.ReactNode }) {
  return <header className="app-header"><Link to="/" className="brand-link"><img className="brand-avatar" src={logo.url} alt="โลโก้ Airiix" /><div><div className="brand-name text-lg">airiix<span className="text-primary">.</span></div><div className="text-[10px] text-muted-foreground">ART & COMMISSION STUDIO</div></div></Link><div className="flex items-center gap-3">{children}<ThemeControl /></div></header>;
}