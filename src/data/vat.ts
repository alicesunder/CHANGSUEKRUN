/**
 * VAT is NOT charged any more (rate 0, removed on 12 Nov 2026): every price on the site is the final price. Orders made
 * earlier keep the VAT stored on them (subtotalPrice / vatAmount / vatRate), so their payment page and documents stay correct.
 * (Before that: VAT 7%. The prices on the site are shown WITHOUT VAT; VAT is added once, on the amount after every discount,
 * when the order is made (the server decides, the form only shows it). VAT is rounded to whole baht so the
 * amount to transfer stays a whole number (the slip check compares it exactly).
 * Free orders (sponsor code, nothing to pay) and admin 1-baht test orders carry no VAT.)
 */
export const VAT_RATE = 0;
export const VAT_PERCENT = 0;

export const vatOf = (subtotal: number): number => (subtotal > 0 ? Math.round(subtotal * VAT_RATE) : 0);

/** subtotal (before VAT) -> what the customer pays */
export const withVat = (subtotal: number): number => subtotal + vatOf(subtotal);
