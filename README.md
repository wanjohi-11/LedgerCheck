# LedgerCheck

LedgerCheck is a lightweight browser-based ledger sanity checker. It accepts a simple accounting CSV and surfaces mechanical issues such as unbalanced journals, invalid amounts, missing references and exact duplicate rows.

**Demo:** `https://ledgercheck.valron.co.ke`

## What it checks

- Overall debit/credit control balance.
- Balance per journal/reference.
- Missing reference or account values.
- Invalid debit/credit numbers.
- Rows carrying both debit and credit.
- Zero-value rows.
- Exact duplicate rows.
- Exportable findings CSV.

## Expected CSV format

```csv
date,reference,account,description,debit,credit
2026-09-01,JV-1001,1100,Bank,50000,0
2026-09-01,JV-1001,4000,Sales,0,50000
```

Columns may be left blank for the unused debit/credit side. Values should follow ordinary CSV quoting rules.

## Important scope

LedgerCheck is a mechanical review utility. It does **not** determine whether an entry complies with IFRS, tax rules, company accounting policies or audit standards, and it is not a substitute for a professional audit.

## Run locally

1. Clone or download this repository.
2. Open `index.html` directly in a modern browser or serve the folder through any static web server.
3. Load the sample, paste CSV content or choose a `.csv` file.
4. Click **Run checks**.

No build command, database or API is required.

## cPanel / shared-hosting deployment

1. Create `ledgercheck.valron.co.ke`.
2. Point it to a dedicated root such as `public_html/ledgercheck/`.
3. Upload `index.html` and the `assets/` directory.
4. Enable SSL and force HTTPS if your host supports it.
5. Open the subdomain; the application runs entirely client-side.

## Project structure

```text
LedgerCheck/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
└── assets/
    ├── app.js
    ├── icon.svg
    └── styles.css
```

## Privacy model

CSV files are read with the browser `FileReader` API and analyzed client-side. The included build does not send ledger data to a Valron server or any third-party service.

## Roadmap ideas

- Configurable account-chart validation.
- Opening/closing balance checks.
- Trial-balance import mode.
- Date-period and currency validation.
- Suspense-account rules.
- Duplicate detection with fuzzy matching.
- Optional local IndexedDB history.

## License

MIT.
