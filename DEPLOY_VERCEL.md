# ขึ้นเว็บบน Vercel + Supabase

โครงสร้าง: หน้าเว็บ (Vite) เป็นไฟล์สถิต, API อยู่ที่ `api/index.js` (ฟังก์ชันของ Vercel), ข้อมูลทั้งหมดอยู่ใน Supabase (สคีมา `csr`)

## 1) Supabase
- ตารางถูกสร้างแล้วในโปรเจกต์ `changsuek-run-staging` (ไฟล์ `supabase/migrations/001_csr_schema.sql` ใช้สร้างซ้ำในโปรเจกต์อื่น: วางใน SQL Editor แล้วกด Run)
- เอา `DATABASE_URL`: **Connect → Transaction pooler** (พอร์ต 6543) แล้วแทน `[YOUR-PASSWORD]` ด้วยรหัสผ่านฐานข้อมูล (ถ้ารหัสมีอักขระพิเศษ เช่น `@ # /` ต้องเข้ารหัส URL หรือเปลี่ยนรหัสให้เป็นตัวอักษร/ตัวเลข)

## 2) Vercel → Settings → Environment Variables (Production)
| ตัวแปร | ค่า |
|---|---|
| `DATABASE_URL` | จากข้อ 1 |
| `ADMIN_USERNAME` | adminbpp |
| `ADMIN_PASSWORD` | รหัสผ่านแอดมิน |
| `ADMIN_SESSION_SECRET` | ข้อความสุ่มยาว ๆ (ต้องคงที่ ห้ามเปลี่ยนบ่อย) |
| `OMISE_SECRET_KEY` | `skey_test_...` ก่อน แล้วค่อยเปลี่ยนเป็น `skey_...` |
| `SITE_URL` | โดเมนจริง เช่น `https://ชื่อโดเมน` (ใช้กับรูปตอนแชร์ลิงก์) |

หลังเพิ่มหรือแก้ตัวแปร ต้อง **Redeploy** (ตัวแปรใหม่ไม่มีผลกับรุ่นที่ deploy ไปแล้ว)

## 3) Omise
ตั้ง Webhook เป็น `https://โดเมน/api/payment-webhook`

## 4) ตรวจหลัง deploy
- เปิด `https://โดเมน/api/public-config` ต้องเห็น JSON ที่มี `"paymentReady":true`
- ล็อกอินแอดมิน, ลองสมัคร 1 รายการด้วย key ทดสอบ แล้วดูแถวใหม่ใน Supabase → Table Editor → schema `csr` → `orders`

## หมายเหตุ
- แก้โค้ดใน `server/` หรือ `src/data/` แล้วต้องรัน `npm run build` (สร้าง `api/index.js` ใหม่) ก่อน commit; Vercel จะรันให้เองตอน deploy
- รันในเครื่อง (`npm run dev`) โดยไม่ใส่ `DATABASE_URL` จะใช้ฐานข้อมูลในเครื่องที่ `data/pgdata` (ล้างข้อมูลทดสอบได้โดยลบโฟลเดอร์ `data`)
