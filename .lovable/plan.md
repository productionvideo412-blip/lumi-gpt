
## Phase 1: Subscription & Payments System

### Step 1: Database Schema (Migration)
- **user_roles** table (admin/user roles via `app_role` enum)
- **subscriptions** table (user_id, plan, start_date, expiry_date, status)
- **payments** table (user_id, plan, transaction_id unique, screenshot_url, status, created_at)
- **daily_usage** table (user_id, date, messages_used, images_used)
- Add `has_role()` security definer function
- RLS policies: users see own data, admins see all
- Storage bucket for payment screenshots

### Step 2: Pricing Page (`/pricing`)
- 3 plans: Basic ₹99, Pro ₹199 (highlighted), Premium ₹499
- Feature comparison, mobile-first design
- "Upgrade Now" buttons → payment flow

### Step 3: UPI Payment Flow (`/payment`)
- Show UPI ID (eshant12@fam), QR code placeholder, amount
- Transaction ID input (required, 12-20 chars)
- Screenshot upload (optional)
- Submit → saves to payments table as "pending"
- Duplicate transaction ID prevention

### Step 4: Admin Dashboard (`/admin`)
- Protected by `has_role(auth.uid(), 'admin')` check
- Overview: total users, active subs, pending payments, revenue
- Payment requests table with approve/reject actions
- Filters by status and plan
- On approve: activate subscription for 30 days, reset usage
- On reject: update status

### Step 5: Usage Tracking
- Track daily messages and images per user
- Enforce limits based on plan (free=10, basic=30/5, pro=120/25, premium=500/80)
- Reset daily via date check

### Step 6: Seed Admin Role
- Insert admin role for officiallovevibe@gmail.com after they sign up

### What's NOT included in this phase (next messages):
- Profile page fixes & real-time stats
- Google Sign-In
- Create page with image generation
- Fix generators, voice chat, notifications, language, settings
- API key system, coupons, notifications admin
- Analytics charts
