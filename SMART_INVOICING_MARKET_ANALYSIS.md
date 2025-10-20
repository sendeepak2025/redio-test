# Smart Invoicing - Market Analysis & Pricing Models

## Overview
This document provides a comprehensive analysis of how companies in the medical imaging and PACS industry structure their pricing and invoicing models.

---

## 1. Common Pricing Models in Medical Imaging

### A. Per-Study Pricing
**How it works:** Charge per imaging study processed/stored
- **Range:** $0.50 - $5.00 per study
- **Used by:** Cloud PACS providers, teleradiology services
- **Pros:** Predictable costs based on volume
- **Cons:** Can get expensive with high volumes

### B. Per-User/Seat Licensing
**How it works:** Monthly/annual fee per radiologist or user
- **Range:** $50 - $500 per user/month
- **Used by:** Enterprise PACS, reporting software
- **Pros:** Predictable monthly costs
- **Cons:** Doesn't scale with actual usage

### C. Storage-Based Pricing
**How it works:** Charge based on data storage volume
- **Range:** $0.10 - $0.50 per GB/month
- **Used by:** Cloud storage providers, archiving services
- **Pros:** Pay only for what you store
- **Cons:** Costs grow with data retention

### D. Tiered Subscription Plans
**How it works:** Fixed monthly fee with usage limits
- **Small Clinic:** $200-500/month (up to 100 studies)
- **Medium Hospital:** $1,000-3,000/month (up to 1,000 studies)
- **Large Enterprise:** $5,000-15,000/month (unlimited)
- **Used by:** Most SaaS PACS providers
- **Pros:** Simple, predictable billing
- **Cons:** May overpay or hit limits

---

## 2. Competitor Pricing Analysis

### Cloud PACS Providers

#### **Ambra Health**
- **Model:** Tiered subscription + per-study overage
- **Pricing:** $1,500-5,000/month base + $1-2 per study over limit
- **Features:** Cloud storage, AI integration, viewer
- **Target:** Medium to large hospitals

#### **Nuance PowerShare (now Microsoft)**
- **Model:** Per-radiologist licensing
- **Pricing:** $300-600 per radiologist/month
- **Features:** Enterprise PACS, reporting, workflow
- **Target:** Large healthcare systems

#### **PaxeraHealth**
- **Model:** Hybrid (on-premise + cloud)
- **Pricing:** $10,000-50,000 one-time + $500-2,000/month maintenance
- **Features:** Full PACS suite, customizable
- **Target:** Hospitals wanting control

#### **Intelerad**
- **Model:** Per-study + storage
- **Pricing:** $0.75-1.50 per study + $0.20/GB storage
- **Features:** Cloud PACS, AI tools, mobile access
- **Target:** Multi-site healthcare networks

#### **Sectra**
- **Model:** Enterprise licensing
- **Pricing:** $100,000-500,000/year (site license)
- **Features:** Full imaging IT solution
- **Target:** Large hospitals and imaging centers

---

## 3. Teleradiology & Reporting Services

#### **vRad (Virtual Radiologist)**
- **Model:** Per-read pricing
- **Pricing:** $15-50 per interpretation
- **Features:** 24/7 radiologist coverage
- **Target:** Hospitals needing coverage

#### **Radiology Partners**
- **Model:** Contract-based (per-read or FTE equivalent)
- **Pricing:** $25-75 per read or $200K-400K/year per FTE
- **Features:** Full radiology department outsourcing
- **Target:** Hospitals, imaging centers

---

## 4. AI & Advanced Analytics

#### **Aidoc**
- **Model:** Per-scan AI analysis
- **Pricing:** $1-3 per scan analyzed
- **Features:** AI triage, critical findings detection
- **Target:** Emergency departments

#### **Zebra Medical Vision**
- **Model:** Subscription per modality
- **Pricing:** $10,000-30,000/year per AI algorithm
- **Features:** Multiple AI detection tools
- **Target:** Imaging centers, hospitals

---

## 5. Recommended Pricing Strategy for Your System

### **Hybrid Tiered Model** (Most Competitive)

#### **Tier 1: Small Clinic**
- **Price:** $299/month
- **Includes:**
  - Up to 200 studies/month
  - 100 GB storage
  - 3 user accounts
  - Basic reporting
  - Email support

#### **Tier 2: Medium Practice**
- **Price:** $799/month
- **Includes:**
  - Up to 1,000 studies/month
  - 500 GB storage
  - 10 user accounts
  - Structured reporting
  - Priority support
  - Basic analytics

#### **Tier 3: Hospital**
- **Price:** $2,499/month
- **Includes:**
  - Up to 5,000 studies/month
  - 2 TB storage
  - Unlimited users
  - Advanced reporting & templates
  - 24/7 support
  - Full analytics dashboard
  - Multi-site support

#### **Tier 4: Enterprise**
- **Price:** Custom (starting at $5,000/month)
- **Includes:**
  - Unlimited studies
  - Unlimited storage
  - Unlimited users
  - White-label options
  - Dedicated support
  - Custom integrations
  - SLA guarantees

### **Add-On Services**
- **Extra Storage:** $0.15/GB/month
- **Overage Studies:** $0.75 per study
- **AI Integration:** $500-1,500/month per module
- **Custom Templates:** $500 one-time setup
- **Training Sessions:** $200/hour
- **Implementation:** $2,000-10,000 one-time

---

## 6. Invoicing Best Practices

### **Billing Cycle Options**
1. **Monthly:** Most common, easier for cash flow
2. **Quarterly:** 5% discount
3. **Annual:** 15% discount (2 months free)

### **Payment Methods**
- Credit card (instant activation)
- ACH/Bank transfer (for larger accounts)
- Purchase orders (enterprise only)
- Net 30 terms (for established customers)

### **Invoice Components**
```
Base Subscription Fee: $799.00
Additional Storage (50 GB): $7.50
Overage Studies (150 studies): $112.50
AI Module - Lung Nodule Detection: $500.00
-------------------------------------------
Subtotal: $1,419.00
Tax (if applicable): $113.52
-------------------------------------------
Total Due: $1,532.52
```

### **Usage Tracking**
- Real-time dashboard showing current usage
- Email alerts at 80% and 100% of limits
- Automatic upgrade suggestions
- Detailed monthly usage reports

---

## 7. Competitive Advantages to Highlight

### **Your Differentiators**
1. **Open Source Foundation:** Lower costs than proprietary systems
2. **Self-Hosted Option:** No recurring cloud fees for some customers
3. **Orthanc Integration:** Industry-standard, reliable
4. **Flexible Deployment:** Cloud, on-premise, or hybrid
5. **No Vendor Lock-in:** Standard DICOM, can migrate anytime
6. **Transparent Pricing:** No hidden fees

### **Value Proposition**
- **vs. Enterprise PACS:** 60-80% cost savings
- **vs. Cloud-only:** Option to self-host and eliminate recurring fees
- **vs. Legacy Systems:** Modern UI, mobile access, AI-ready

---

## 8. Market Positioning Chart

```
Price vs Features Matrix:

High Price │                    Sectra ●
           │              Nuance ●
           │                   
           │         Ambra ●    Intelerad ●
           │              
           │    PaxeraHealth ●
           │         
           │  [YOUR SYSTEM] ★
           │         
Low Price  │  Open Source (Free) ●
           └─────────────────────────────────
           Basic              Advanced
                  Features
```

---

## 9. Implementation Roadmap

### **Phase 1: MVP Invoicing (Month 1)**
- [ ] Basic subscription tiers
- [ ] Manual invoice generation
- [ ] Usage tracking dashboard
- [ ] Payment via bank transfer

### **Phase 2: Automated Billing (Month 2-3)**
- [ ] Stripe/payment gateway integration
- [ ] Automatic invoice generation
- [ ] Email notifications
- [ ] Usage-based billing calculations

### **Phase 3: Advanced Features (Month 4-6)**
- [ ] Self-service plan upgrades
- [ ] Proration for mid-cycle changes
- [ ] Multi-currency support
- [ ] Tax calculation automation
- [ ] Dunning management (failed payments)

---

## 10. Revenue Projections

### **Conservative Scenario (Year 1)**
- 5 Small Clinics × $299 = $1,495/month
- 2 Medium Practices × $799 = $1,598/month
- 1 Hospital × $2,499 = $2,499/month
- **Total MRR:** $5,592/month
- **Annual Revenue:** $67,104

### **Growth Scenario (Year 2)**
- 20 Small Clinics × $299 = $5,980/month
- 10 Medium Practices × $799 = $7,990/month
- 5 Hospitals × $2,499 = $12,495/month
- 2 Enterprise × $5,000 = $10,000/month
- **Total MRR:** $36,465/month
- **Annual Revenue:** $437,580

---

## Resources & Tools

### **Billing Software Options**
1. **Stripe Billing:** Best for SaaS, usage-based billing
2. **Chargebee:** Advanced subscription management
3. **Recurly:** Enterprise-grade billing
4. **Paddle:** Merchant of record (handles tax)

### **Market Research Sources**
- KLAS Research (healthcare IT ratings)
- Signify Research (medical imaging market reports)
- HIMSS Analytics (healthcare IT trends)

---

## Next Steps

1. **Validate Pricing:** Survey 10-20 potential customers
2. **Build MVP:** Basic subscription + manual invoicing
3. **Pilot Program:** Offer 3-month trial at 50% discount
4. **Iterate:** Adjust pricing based on feedback
5. **Scale:** Automate billing and add features

---

*Last Updated: October 20, 2025*
