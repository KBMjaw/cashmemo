# Business Document Maker

A fast, professional web app for creating **Cash Receipts, Quotations, Invoices, and Payment Receipts** with automatic GST calculations, Indian-currency amount-in-words, and instant PDF/image/print/WhatsApp export — no login, no backend, no accounting knowledge required.

## Features

- Two-panel live editor: form on the left, an A4-styled preview on the right that updates instantly
- Company details with logo upload, saved as reusable defaults
- Customer details, document numbering (auto or manual), dynamic item table
- Optional GST with 0/5/12/18/28% or custom rate, Intra-State (CGST+SGST) / Inter-State (IGST), flat or percentage discount, optional round-off
- Indian-numbering-system amount-in-words (Thousand/Lakh/Crore), paise-aware
- Decimal-safe money math (all calculations run in integer paise to avoid floating point errors)
- Print, multi-page-safe PDF export, PNG export, Web Share API, WhatsApp share
- Recent Documents history (view/edit/duplicate/download/delete) stored in `localStorage`
- Settings page for company defaults, document number prefixes, and default tax/footer
- Responsive: two-panel on desktop, form-first with a Preview tab on mobile

## Tech stack

React + TypeScript + Vite, Tailwind CSS v4, jsPDF + html2canvas-pro for export, `localStorage` for persistence (no backend required for this MVP).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
```
