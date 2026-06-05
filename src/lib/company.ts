/**
 * Central company / tax / payment details for 4K Smart Solutions.
 * Used across all printable documents (invoices, delivery notes, credit notes,
 * statements, thermal receipts) so a single edit updates the whole system.
 */
export const COMPANY = {
  name: "4K SMART SOLUTIONS LTD",
  tagline: "Smart Business. Smarter Solutions.",
  services: "Phone Accessories · Internet · Printing",
  address: "P.O Box 12345 - 00100, Nairobi, Kenya",
  phone: "+254 700 000 000  |  0736 217 411",
  email: "info@4ksmart.co.ke",
  website: "www.4ksmart.co.ke",

  // KRA / tax
  kraPin: "P052399943U",
  vatNo: "0123456A",

  // Payment
  bankName: "KCB Bank Kenya",
  accountName: "4K Smart Solutions Ltd",
  accountNo: "1234567890",
  paybill: "4183147",
  paybillAccount: "4KSmart",
} as const;
