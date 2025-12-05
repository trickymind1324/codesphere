# PRD-04: Monetization & Pricing Strategy

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft
**Owner:** Product & Business Team

## 1. Executive Summary

This PRD defines the monetization strategy for CodeSphere, including pricing tiers, feature gating, payment processing, and revenue projections. CodeSphere operates a dual-sided marketplace: candidates (B2C) and companies (B2B), each with distinct pricing models.

## 2. Business Model

**Two-Sided Marketplace:**
1. **Candidate Side (B2C):** Freemium model with premium subscriptions
2. **Enterprise Side (B2B):** Subscription-based with usage limits

**Revenue Streams:**
- Candidate premium subscriptions (Pro tier): $29/month or $290/year (save 17%)
- Enterprise subscriptions: $499-$2,999/month
- Marketplace commissions: 20% on user-created courses (future)
- Job board postings: $299 per job post (future)

## 3. Candidate Pricing (B2C)

### 3.1 Pricing Tiers

| Feature | **Free** | **Pro** ($29/mo) |
|---------|----------|------------------|
| **Problems Access** | 100 problems | All problems (1000+) |
| **Premium Problems** | ❌ | ✅ |
| **Real-World Debugging** | 5 scenarios | Unlimited |
| **Code Execution** | 100 runs/day | Unlimited |
| **AI Tutor** | 10 hints/day | Unlimited |
| **Solutions & Editorials** | After 3 failed attempts | Immediate access |
| **Code Playback** | ❌ | ✅ |
| **Progress Analytics** | Basic | Advanced (heatmaps, trends) |
| **Custom Test Cases** | 3 per problem | Unlimited |
| **Offline Mode (PWA)** | ❌ | ✅ |
| **No Ads** | ❌ | ✅ (Ad-free experience) |
| **Interview Prep Kits** | ❌ | ✅ (Company-specific) |
| **Priority Support** | ❌ | ✅ (24h response) |

### 3.2 Pricing Psychology

**Anchoring:**
- Show annual plan first: "$290/year (Save $58!)" → makes monthly seem reasonable
- Compare to competitors: "LeetCode Premium: $35/mo | CodeSphere Pro: $29/mo"

**Free Trial:**
- 7-day free trial for Pro (no credit card required)
- After trial: Show modal "Your trial has ended. Upgrade to Pro to continue?"

**Upgrade Prompts:**
- **Hit Limit:** "You've used 10/10 AI hints today. Upgrade to Pro for unlimited hints!"
- **Premium Problem:** "This is a premium problem. Upgrade to Pro to unlock."
- **Feature Tease:** Show locked features with "Pro" badge (e.g., Code Playback 🔒 Pro)

### 3.3 Payment Processing

**Provider:** Stripe (industry standard, easy integration)

**Payment Methods:**
- Credit/debit cards (Visa, Mastercard, Amex)
- PayPal
- Apple Pay / Google Pay (for mobile)
- Local payment methods (future): UPI (India), Alipay (China), iDEAL (Netherlands)

**Billing Cycle:**
- Monthly: $29/month (auto-renew)
- Annual: $290/year (billed once, save 17%)

**Cancellation:**
- Cancel anytime (no questions asked)
- Access remains until end of billing period
- Offer "Pause subscription" for 3 months (retain customer)

**Refund Policy:**
- 30-day money-back guarantee (no questions asked)
- Auto-refund if <5% of features used within 30 days

### 3.4 Upsell & Cross-sell

**Upsell Strategies:**
- **In-app prompts:** When user hits limit, show upgrade modal
- **Email campaigns:** "You solved 50 problems! Unlock 1000+ with Pro"
- **Social proof:** "Join 50,000+ Pro members"

**Cross-sell (Future):**
- Interview coaching: $99 for 1-hour session with ex-FAANG engineer
- Resume review: $49 for detailed feedback
- Mock interviews: $79 per session

## 4. Enterprise Pricing (B2B)

### 4.1 Pricing Tiers

| Feature | **Starter** ($499/mo) | **Growth** ($999/mo) | **Enterprise** (Custom) |
|---------|-----------------------|----------------------|-------------------------|
| **Assessments** | 50/month | 200/month | Unlimited |
| **Active Candidates** | 500 | 2,000 | Unlimited |
| **Team Members** | 5 | 20 | Unlimited |
| **Glass Box Analytics** | ✅ | ✅ | ✅ |
| **Code Playback** | ✅ | ✅ | ✅ |
| **Custom Branding** | ❌ | ✅ (Logo, colors) | ✅ (Full white-label) |
| **ATS Integration** | ❌ | ✅ (Greenhouse, Lever) | ✅ (Custom integrations) |
| **SSO (SAML)** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | Limited | Full API access |
| **Dedicated Support** | Email | Priority email + chat | Dedicated CSM |
| **SLA** | 99% uptime | 99.9% uptime | 99.95% uptime + custom SLA |
| **Data Residency** | US | US or EU | Custom (APAC, etc.) |
| **Contract Length** | Monthly | Annual | Multi-year |

### 4.2 Pricing Model

**Seat-Based + Usage-Based Hybrid:**
- **Base Price:** Covers team members (seats)
- **Assessment Credits:** Monthly allowance, overage charges

**Example: Growth Plan ($999/month)**
- Includes: 20 team members, 200 assessments
- Overage: $5 per additional assessment
- Annual commitment: 15% discount ($10,190/year instead of $11,988)

**Enterprise Plan (Custom):**
- Quote-based pricing (talk to sales)
- Typical range: $2,500 - $10,000/month
- Factors: Candidate volume, custom features, data residency, support level

### 4.3 Sales Strategy

**Self-Serve (Starter & Growth):**
- Sign up online with credit card
- Instant access
- No sales call required

**Enterprise (Custom):**
- "Contact Sales" button on pricing page
- Sales team qualifies lead (call/demo)
- Proposal with custom pricing
- Contract negotiation
- Onboarding call with CSM

**Free Trial for Enterprise:**
- 14-day free trial (50 assessments)
- No credit card required
- Includes demo call with sales engineer

### 4.4 Contract Terms

**Payment Terms:**
- Starter & Growth: Monthly or annual (credit card)
- Enterprise: Annual or multi-year (invoice, net-30 terms)

**Auto-Renewal:**
- All plans auto-renew unless canceled 30 days before expiry
- Price lock for annual/multi-year contracts

**Overages:**
- Assessments: $5 per additional assessment (billed monthly)
- Candidates: $0.50 per additional candidate beyond plan limit

**Downgrades:**
- Allowed at end of billing period (no mid-cycle downgrades)
- Must reduce team size to match new plan

## 5. Feature Gating & Paywall Logic

### 5.1 Candidate Side

**Hard Gates (Block Access):**
- Premium problems: Show "Upgrade to Pro" modal (can't view)
- AI Tutor after 10 hints: Show upgrade modal
- Code Playback: Show blurred preview + "Pro feature" badge

**Soft Gates (Limit Features):**
- Solutions: Free users wait 3 failed submissions
- Code execution: Free users get slower queue (30s delay)
- Problems: Free users see only 100 problems (filter out rest)

**Implementation:**
```typescript
function canAccessProblem(user: User, problem: Problem): boolean {
  if (problem.isPremium && user.tier === 'free') {
    return false;
  }
  return true;
}

function canUseAITutor(user: User): boolean {
  if (user.tier === 'pro') return true;

  const hintsUsedToday = getHintsUsedToday(user.id);
  return hintsUsedToday < 10;
}
```

### 5.2 Enterprise Side

**Hard Gates:**
- Assessment creation: Blocked if monthly quota exceeded
- Team member invites: Blocked if seat limit reached
- Custom branding: Only Growth+ (show upgrade prompt)

**Soft Gates:**
- Support response time: Slower for lower tiers

### 5.3 Usage Tracking

**What to Track:**
- Candidate: AI hints used, code executions, problems solved
- Enterprise: Assessments created, candidates invited, team members

**Storage:**
- Redis counters (reset daily/monthly)
- PostgreSQL for historical usage (billing)

## 6. Payment Infrastructure

### 6.1 Stripe Integration

**Setup:**
- Create Stripe account (live + test mode)
- Configure webhook endpoint: `/api/v1/webhooks/stripe`
- Handle events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`

**Subscription Flow:**
1. User clicks "Upgrade to Pro"
2. Frontend calls `/api/v1/subscriptions/create-checkout`
3. Backend creates Stripe Checkout Session
4. Redirect user to Stripe hosted page
5. User enters payment info, completes purchase
6. Stripe webhook notifies backend (`checkout.session.completed`)
7. Backend updates user tier in database
8. Frontend polls `/api/v1/user/me` to refresh user data
9. Show success modal: "Welcome to Pro!"

**Webhook Handler:**
```typescript
app.post('/api/v1/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await activateSubscription(session.customer, session.subscription);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      await handleFailedPayment(invoice.customer);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await deactivateSubscription(subscription.customer);
      break;
  }

  res.json({ received: true });
});
```

### 6.2 Invoice & Billing

**Invoices:**
- Auto-generated by Stripe (PDF download)
- Emailed to customer on successful payment
- Viewable in Settings > Billing

**Billing Portal:**
- Stripe Customer Portal (hosted by Stripe)
- User can update payment method, download invoices, cancel subscription
- Link: `/api/v1/subscriptions/portal` (redirects to Stripe)

### 6.3 Tax Handling

**Sales Tax (US):**
- Stripe Tax (automatic calculation based on customer location)
- Collect sales tax for US states with economic nexus

**VAT (Europe):**
- Reverse charge for B2B (companies provide VAT number)
- Charge VAT for B2C (consumers)

**India GST:**
- 18% GST for Indian customers (future)

## 7. Discounts & Promotions

### 7.1 Discount Types

**Annual Discount:**
- 17% off (2 months free): $290/year instead of $348

**Student Discount:**
- 50% off ($14.50/month)
- Verify with university email (.edu) or student ID

**Non-Profit Discount:**
- 40% off for registered non-profits
- Manual approval required

**Team Discount (Candidates):**
- Refer 3 friends → 1 month free
- Referral code: Unique code per user

**Enterprise Discounts:**
- Annual commitment: 15% off
- Multi-year (2-3 years): 20% off
- Volume discount (>100 assessments/month): Custom pricing

### 7.2 Promotional Campaigns

**Launch Promotion:**
- First 1,000 users: 50% off for lifetime (lock-in early adopters)

**Seasonal Promotions:**
- Black Friday: 30% off annual plan
- New Year: "New Year, New Skills" - $19/month for 3 months

**Referral Program:**
- Referrer: 1 month free for each successful referral (up to 6 months)
- Referee: 20% off first month

### 7.3 Coupon System

**Coupon Codes:**
- `STUDENT50` - 50% off for students
- `LAUNCH50` - 50% off lifetime (first 1,000 users)
- `NEWYEAR30` - 30% off (expires Jan 31)

**Implementation:**
```typescript
function applyCoupon(coupon: string, user: User): Discount {
  const couponData = getCouponFromDB(coupon);

  if (!couponData || couponData.expired) {
    throw new Error('Invalid or expired coupon');
  }

  if (couponData.usageLimit && couponData.usageCount >= couponData.usageLimit) {
    throw new Error('Coupon usage limit reached');
  }

  return {
    type: couponData.type,  // 'percentage' or 'fixed'
    value: couponData.value,  // 50 (for 50%) or 10 (for $10 off)
    duration: couponData.duration  // 'once', 'repeating', 'forever'
  };
}
```

## 8. Churn Reduction & Retention

### 8.1 Cancellation Flow

**When User Clicks "Cancel":**
1. Show survey: "Why are you canceling?" (optional)
   - Too expensive
   - Not using enough
   - Missing features
   - Found alternative
2. Offer alternatives:
   - **Too expensive:** "Save 17% with annual plan"
   - **Not using:** "Pause for 3 months (keep access)"
   - **Missing features:** "Tell us what you need (we'll prioritize)"
3. If still canceling: Confirm cancellation
4. Send email: "Sorry to see you go. Here's 30% off to come back"

### 8.2 Win-Back Campaigns

**Canceled Users:**
- Email 7 days after: "We miss you! Here's 30% off to return"
- Email 30 days after: "New features added: [X, Y, Z]. Come back!"
- Email 90 days after: "50% off to rejoin"

**Inactive Users (Haven't logged in 30 days):**
- Email: "You haven't solved a problem in 30 days. Here's a challenge!"
- Push notification (if enabled): "Your 7-day streak is at risk!"

### 8.3 Retention Tactics

**Gamification:**
- Daily streak bonuses
- Badges for milestones (100 problems solved, 30-day streak)
- Leaderboards (global, company, university)

**Community:**
- Discussion forums
- Weekly coding challenges (prizes for winners)
- User-generated content (courses, problems)

**Continuous Value:**
- Weekly newsletter: "5 new problems added this week"
- Personalized recommendations: "You should try [problem] next"
- Progress emails: "You've improved 20% this month!"

## 9. Revenue Projections

### 9.1 Assumptions (Year 1)

**Candidate Side:**
- Total signups: 100,000 (month 12)
- Free users: 90,000 (90%)
- Pro users: 10,000 (10% conversion)
- Pro MRR: 10,000 × $29 = $290,000/month
- Annual ARR: $3.48M

**Enterprise Side:**
- Starter customers: 50 (month 12)
- Growth customers: 20 (month 12)
- Enterprise customers: 5 (month 12)
- MRR: (50 × $499) + (20 × $999) + (5 × $5,000) = $69,930/month
- Annual ARR: $839,160

**Total ARR (Year 1):** ~$4.3M

### 9.2 Unit Economics

**Customer Acquisition Cost (CAC):**
- Candidate (B2C): $15 (paid ads, content marketing)
- Enterprise (B2B): $1,500 (sales team, demos)

**Lifetime Value (LTV):**
- Candidate Pro: $29/month × 18 months avg = $522 (LTV:CAC = 35:1)
- Enterprise Growth: $999/month × 24 months avg = $23,976 (LTV:CAC = 16:1)

**Target Metrics:**
- LTV:CAC > 3:1 (healthy)
- Payback period < 12 months

### 9.3 Growth Levers

**Increase Conversion (Free → Pro):**
- A/B test upgrade prompts (e.g., modal vs. banner)
- Improve paywall experience (show value, not blockers)
- Target: 10% → 15% conversion (50% increase in Pro users)

**Reduce Churn:**
- Improve onboarding (new users solve first problem in 5 min)
- Add features users want (survey + roadmap)
- Target: 5% monthly churn → 3% (40% reduction)

**Expand ARPU (Average Revenue Per User):**
- Upsell to annual plans (higher revenue upfront)
- Cross-sell services (coaching, mock interviews)
- Target: $29/month → $35/month (21% increase)

## 10. Competitor Pricing Analysis

| Platform | **Free** | **Premium** | **Key Differentiators** |
|----------|----------|-------------|-------------------------|
| **LeetCode** | 50 problems | $35/month or $159/year | Large problem set, company tags |
| **HackerRank** | Free for candidates | N/A | Enterprise focus (B2B only) |
| **Codility** | N/A | Enterprise only ($$$) | Assessment platform (no learning) |
| **CodeSphere** | 100 problems | $29/month or $290/year | **AI tutor, real-world debugging, Glass Box analytics** |

**Positioning:** "More affordable than LeetCode, more features than HackerRank"

## 11. Success Metrics

- **Conversion Rate (Free → Pro):** >10% within 3 months
- **Churn Rate:** <5% monthly for Pro users
- **LTV:CAC Ratio:** >3:1
- **ARR Growth:** 100% YoY
- **Enterprise Customers:** 100+ by end of Year 1
- **NPS (Net Promoter Score):** >50

## 12. Future Monetization (Post-MVP)

**Marketplace:**
- User-created courses (20% commission)
- Custom problem sets (sell to companies)

**Job Board:**
- $299 per job post
- Premium placement: $499

**Certifications:**
- CodeSphere Certified Developer: $99 per exam
- Verified badge on profile

**Partnerships:**
- Affiliate revenue (refer candidates to bootcamps, get 10%)
- Enterprise partnerships (white-label for universities)
