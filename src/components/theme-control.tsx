import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeControl() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  function change(value: boolean) { setDark(value); document.documentElement.classList.toggle('dark', value); }
  return <div className="theme-control" aria-label="สีหน้าจอ"><Button variant="ghost" size="icon" aria-label="โหมดสว่าง" title="โหมดสว่าง" aria-pressed={!dark} onClick={() => change(false)}><Sun /></Button><Button variant="ghost" size="icon" aria-label="โหมดมืด" title="โหมดมืด" aria-pressed={dark} onClick={() => change(true)}><Moon /></Button></div>;
}