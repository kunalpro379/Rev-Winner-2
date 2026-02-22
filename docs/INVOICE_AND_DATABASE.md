# Invoice and database

## Required tables for invoice

Invoices are generated from the following **required** data:

| Table            | Purpose |
|------------------|--------|
| `pending_orders` | Order and cart snapshot (line items, totals, metadata). Invoice line items and totals come from here. |
| `auth_users`     | Customer name, email, phone, organization for “Bill To”. |

No separate “invoices” table is required. The invoice is built on demand from the completed `pending_orders` row and user data.

## Optional: branding and terms from `system_config`

Company name, address, email, website, and terms are **not** hardcoded. They are read from the **`system_config`** table (section `system`) when present. If missing or the table does not exist, the invoice still works with empty company/terms and minimal fallback terms.

Optional keys (section `system`):

| Key             | Use on invoice |
|-----------------|----------------|
| `siteName`      | Company name |
| `siteUrl`       | Website URL |
| `supportEmail`  | Contact email |
| `companyAddress`| Company address (multi-line; use `\n` for new lines) |
| `gstNumber`     | GST number (if applicable) |
| `invoiceTerms`  | Terms and conditions (one line per paragraph) |

You can add or edit these in **Admin → System Configuration → System** (e.g. `companyAddress`, `invoiceTerms`). If a key is missing, that part of the invoice is left empty or uses the fallback terms.

## Summary

- **Required for invoice:** `pending_orders`, `auth_users`.
- **Optional for branding/terms:** `system_config` with the keys above.
- No dedicated invoice storage table; invoice = order + user + optional config.
