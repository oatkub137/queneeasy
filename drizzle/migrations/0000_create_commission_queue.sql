CREATE TABLE public.commissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 queue_no integer NOT NULL DEFAULT 1,
 contact text NOT NULL DEFAULT '',
 type text NOT NULL DEFAULT 'คิวปกติ' CHECK (type IN ('คิวปกติ','คิวเร่ง')),
 program text NOT NULL DEFAULT 'เต็มตัว' CHECK (program IN ('Ych','เต็มตัว','หัว-สะโพก','หัว-เอว','ลงสี','ตัดเส้น')),
 scale text NOT NULL DEFAULT 'ปกติ' CHECK (scale IN ('จิบิ','เด็กประถม','ปกติ','ขตต','กาว','ชีท')),
 status text NOT NULL DEFAULT 'รอคิว' CHECK (status IN ('กำลังทำ','รอคิว','ส่งแล้ว')),
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their queue" ON public.commissions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX commissions_owner_queue ON public.commissions (user_id, queue_no);