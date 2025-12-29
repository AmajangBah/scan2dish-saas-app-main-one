# 🍽️ Scan2Dish

**QR-based contactless ordering system for restaurants**

A modern, fast, and user-friendly platform that enables restaurants to offer contactless ordering through QR codes. Customers scan, browse the menu, order, and track their food—all from their phones.

---

## ✨ Features

### Core Features
- 🔐 **Restaurant Authentication** - Secure signup and login for restaurant owners
- 📱 **QR Code Ordering** - Customers scan table QR codes to access the menu
- 🍔 **Menu Management** - Full CRUD operations for menu items with categories, variants, and tags
- 🪑 **Table Management** - Manage tables with QR code generation
- 📦 **Order Management** - Real-time order tracking and status updates
- 📊 **Analytics Dashboard** - Track sales, revenue, top items, and trends
- 🎉 **Discounts** - Create and manage promotional discounts
- ⚙️ **Settings** - Configure business profile and branding
- 🔒 **Row Level Security** - Supabase RLS ensures data isolation

### 🆕 New Features
- 🌍 **Multi-Language Support** - English, French, Spanish (400+ translated strings)
- 💰 **Multi-Currency Support** - 9 currencies: USD, EUR, GBP, GMD, XOF, NGN, GHS, ZAR, KES
- 🎓 **Onboarding Wizard** - 7-step guided setup for new restaurant owners
- 💵 **Commission Transparency** - Clear 5% commission explanation with examples

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Validation**: Zod
- **UI Components**: Radix UI + shadcn/ui

---

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account ([create one here](https://supabase.com))

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd scan2dish-saas-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Go to **Settings** > **API** and copy:
   - Project URL
   - Anon/Public Key
3. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
4. Configure email templates (Settings > Auth > Email Templates)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the App

### Restaurant Owner Flow:

1. **Sign Up**: Go to `/register` and create an account
2. **Confirm Email**: Check your email and click the confirmation link
3. **Login**: Go to `/login` and sign in
4. **Complete Onboarding**: Follow the 7-step wizard:
   - Welcome & introduction
   - Understand 5% commission model
   - Set up business profile (name, phone, currency, branding)
   - Add first table
   - Build your menu
   - Generate QR codes
   - Celebrate completion! 🎉
5. **Start Receiving Orders**: Customers can now order through QR codes
6. **Manage Orders**: Update status, track performance
7. **Switch Languages**: Use language switcher (🇬🇧 🇫🇷 🇪🇸) in navbar

### Customer Flow:

1. **Scan QR Code**: Scan the table QR code (or visit `/menu/[tableId]/browse`)
2. **Browse Menu**: View available items and categories
3. **Add to Cart**: Select items and adjust quantities
4. **Place Order**: Go to cart and submit order
5. **Track Order**: See real-time order status updates

---

## 📁 Project Structure

```
/app
  /(auth)           # Authentication pages (login, register)
  /actions          # Server actions (menu, orders, tables, etc.)
  /api              # API routes (if any)
  /dashboard        # Restaurant owner dashboard
    /analytics      # Analytics and insights
    /discounts      # Discount management
    /menu           # Menu CRUD
    /orders         # Order management
    /settings       # Restaurant settings
    /tables         # Table management
  /menu             # Customer-facing menu pages
    /[tableId]      # Table-specific menu and ordering

/components         # Reusable UI components
/lib                # Utilities and helpers
/types              # TypeScript type definitions
/supabase           # Database schema and migrations
```

---

## 🔒 Security

- **Row Level Security (RLS)**: All database tables use Supabase RLS policies
- **Authentication**: Protected routes with middleware
- **Server-side Validation**: All mutations validated server-side with Zod
- **Price Validation**: Order prices recalculated server-side to prevent tampering

---

## 🐛 Known Issues & Roadmap

See `BUGS_FIXED.md` for recently fixed issues.  
See `NEW_FEATURES_SUMMARY.md` for recently added features.

### ✅ Recently Added:
- ✅ Multi-language support (EN, FR, ES)
- ✅ Multi-currency support (9 currencies)
- ✅ Onboarding wizard (7 steps)
- ✅ Commission transparency

### Future Enhancements:
- [ ] Payment integration (Stripe)
- [ ] File uploads for menu images
- [ ] Real-time order notifications
- [ ] Customer email receipts
- [ ] Opening hours enforcement
- [ ] More languages (Arabic, Portuguese, Chinese)
- [ ] More currencies (regional additions)

---

## 📝 Environment Variables

Required variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Production Checklist:
- ✅ Environment variables configured
- ✅ Supabase production project created
- ✅ Database schema applied
- ✅ Email templates configured
- ✅ RLS policies tested
- ✅ Custom domain configured (optional)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Check `BUGS_FIXED.md` for recently resolved issues

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)

---

**Made with ❤️ for restaurants everywhere**
