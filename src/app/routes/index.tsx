import { createFileRoute } from "@tanstack/react-router";
import { Link } from '@tanstack/react-router';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopHeader } from '@/components/shop-header';
import logo from '@/assets/airiix-logo.jpeg.asset.json';
import { OwnerLogin } from '@/components/owner-login';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'Airiix Studio — ยินดีต้อนรับ' },
    { name: 'description', content: 'พื้นที่จัดการคิวงานวาดของ Airiix Studio' },
    { property: 'og:title', content: 'Airiix Studio — ยินดีต้อนรับ' },
    { property: 'og:description', content: 'พื้นที่จัดการคิวงานวาดของ Airiix Studio' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  return <><ShopHeader /><main className="welcome"><div className="eyebrow">พื้นที่เช็คคิวงานของลูกค้าที่น่ารักทุกคนน :3</div><Sparkles className="welcome-spark spark-left" size={28} aria-hidden="true" /><Heart className="welcome-spark spark-right" size={25} aria-hidden="true" /><img className="welcome-logo" src={logo.url} alt="โลโก้ร้าน Airiix — ตัวละครสาวและแมว" /><h1 className="brand-name">CheckQueue Airiix<span className="text-primary">.</span></h1><p className="welcome-subtitle">หากหาคิวไม่เจออย่าพึ่งตกใจสามารถแจ้งเค้าได้เลยครับ</p><p className="mt-3 text-sm text-muted-foreground">สอบถามความเคลื่อนไหวของคิวได้ตลอด</p><Button asChild className="welcome-action"><Link to="/queue">เข้าสู่หน้าคิวงาน<ArrowRight /></Link></Button><div className="welcome-footer">MADE WITH LOVE · AIRIIX STUDIO</div><OwnerLogin /></main></>;
}
