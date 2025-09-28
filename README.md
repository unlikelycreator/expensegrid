Overview Expense Grid is a secure, locally-run web application built
with React for tracking personal finances, including budgets and credit
card expenses. It operates entirely in the browser, using IndexedDB for
persistent local storage, ensuring no data is transmitted to external
servers. This makes it ideal for privacy-conscious users who want full
control over their financial data. The app consists of two main
dashboards:

Budget Tracker: For managing monthly income, expenses, investments,
settlements, and other categories, with real-time totals and remaining
balance calculations. Credit Cards Tracker: For managing credit cards,
tracking transactions within custom billing cycles based on settlement
days (e.g., 13th of every month), and calculating totals (expenses minus
settlements).

All data is synced between the two dashboards via a shared IndexedDB
database (MoneyMeshDB). Transactions added in one dashboard (e.g.,
credit card expenses) are visible in the other if relevant (e.g., as
expenses or settlements in the budget tracker). Key technical
highlights:

Data Persistence: Uses IndexedDB with object stores for creditCards and
transactions. Transactions are shared and flagged (e.g.,
isCreditCardTransaction) for filtering between dashboards. Syncing
Logic: Transactions from Credit Cards (marked isCreditCardTransaction:
true) appear in Budget Tracker if they match monthly filters. Budget
Tracker entries with a credit card sync to Credit Cards within billing
cycles. Filtering and Sorting: Budget Tracker uses monthly/yearly
filters; Credit Cards uses card-specific billing cycles calculated from
settlementDay (day of the month, e.g., "13"). Export/Import: Universal
header buttons export all data (cards + transactions) to JSON/Excel or
import JSON, overwriting existing data locally. UI: Responsive
dark-themed interface with Tailwind CSS, Shadcn UI components, and
Lucide icons. Supports mobile navigation via hamburger menu.
Authentication: Simple static login (username: "user", password: "pass")
with session storage for protected routes.

Features Budget Tracker Dashboard

Add/edit/delete transactions with fields like name, category
(Income/Expense/etc.), type, status, actual/budget amounts, date,
payment mode, platform, and optional credit card. Monthly/yearly
filtering to view transactions for a specific period. Category totals
and remaining balance cards (Income minus other categories). Row
coloring based on category for visual distinction. Search, category, and
status filters; sortable table. Syncs credit card transactions from the
Credit Cards dashboard (e.g., Expenses and Settlements).

Credit Cards Dashboard

Add/edit/delete credit cards with name, number, background color, and
settlement day (1-31). Add/edit/delete transactions with name, actual
amount, card, category (Expense/Bill), and date. Card-specific
filtering: Select a card to view transactions in its billing cycle
(e.g., 13th of previous month to 13th of current month, based on
settlement day). Displays total spent per card (Expenses minus
Bills/Settlements). Search, category, and card filters; sortable table.
Syncs with Budget Tracker: Transactions appear as Expenses or
Settlements in monthly views.

General Features

Local Storage: All data stored in IndexedDB; no server interaction.
Export/Import: From header -- export to JSON/Excel (combined cards +
transactions); import JSON to restore/overwrite data. Storage Info:
Footer shows available IndexedDB storage (quota, usage in MB).
Responsive UI: Mobile-friendly with hamburger menu; fixed header/footer.
Security: Static login; data remains on-device. Help & Privacy: Footer
dialogs with combined guidance for both dashboards.

Technologies

Frontend Framework: React (with React Router for routing). UI
Components: Shadcn UI (Table, Button, Input, Select, Badge, Dialog,
Card). Icons: Lucide React. Styling: Tailwind CSS for responsive,
dark-themed design. Data Storage: IndexedDB (browser-based database for
persistent local storage). Export/Import: XLSX for Excel export; JSON
for data backup/restore. Storage Estimate: Navigator Storage API for
displaying quota/usage. Other: No external dependencies for data syncing
(all client-side); no backend/server.

Unique Aspects and Security Expense Grid is unique in its fully local,
offline-first approach to financial tracking, combining budget
management with credit card billing cycle tracking without any cloud
dependency. Unlike cloud-based apps (e.g., Mint or YNAB), it ensures
100% data privacy by storing everything in the browser's IndexedDB -- no
network requests, no data sharing, and no risk of breaches from servers.
Security Features:

Local Data Only: All operations (add/edit/delete, export/import) happen
client-side. No API calls or external transmissions. Authentication:
Simple static login with session storage to protect routes; no real
credentials stored. Export/Import Security: Files are
generated/downloaded locally; imports overwrite data but stay
in-browser. Browser Isolation: IndexedDB is sandboxed per origin,
preventing cross-site access. Open Source Transparency: As an
open-source project, the code is auditable for security.

Uniqueness:

Interlinked Dashboards: Transactions sync seamlessly between Budget
Tracker (monthly views) and Credit Cards (billing cycle views based on
settlementDay). Custom Billing Cycles: Credit card filtering uses
dynamic cycles (e.g., 13th to 13th), not fixed months. Visuals:
Category-colored rows/cards; responsive dark theme. Offline Capable:
Works without internet after initial load.

Setup Instructions Prerequisites

Node.js (v18+) npm or yarn

Installation

Clone the repository: textgit clone
https://github.com/unlikelycreator/expensegrid.git cd expense-grid

Install dependencies: textnpm install

Start the development server: textnpm start

Open the app in your browser: https://expensegrid.netlify.app/

Build for Production textnpm run build Serve the build folder with any
static server (e.g., serve -s build). Login

Default credentials: Username: "user", Password: "pass". Customize in
src/pages/Login/Login.jsx.

Customization Since Expense Grid is open-source (MIT License),
customization is endless! Fork the repo and modify:

UI: Change Tailwind classes, add new components, or switch themes (e.g.,
light mode). Features: Add new categories, filters, or dashboards (e.g.,
investment tracker). Storage: Extend IndexedDB with more stores (e.g.,
for user profiles). Authentication: Replace static login with Auth0,
Firebase, or custom backend. Export Formats: Add CSV or PDF export via
libraries like PapaParse or jsPDF. PWA: Make it installable as a
Progressive Web App for offline use. Localization: Add i18n support for
multi-language.

The imagination is endless -- build your personalized financial tool!
License MIT License. See LICENSE for details. Contributing Contributions
welcome! Submit pull requests for bug fixes, features, or improvements.
Open issues for suggestions. Contact For questions, open an issue on
GitHub.
