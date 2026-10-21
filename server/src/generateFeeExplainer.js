
const OFFICIAL_SOURCES = [
  {
    title: "Groww — Brokerage Charges & Pricing",
    url: "https://groww.in/pricing"
  },
  {
    title: "Groww — Understanding Charges in Reports",
    url: "https://groww.in/help/stocks/sx-reports/what-are-the-different-charges-mentioned-in-the-report"
  },
  {
    title: "Groww — Checking Order Charges",
    url: "https://groww.in/help/stocks/order/what-amount-was-charged-for-my-order--86"
  }
];

function generateFeeExplainer(analysis) {
  if (!analysis || !analysis.fee_issue) {
    throw new Error("AI review analysis is required.");
  }

  const feeIssue = analysis.fee_issue;

  const recurring =
    feeIssue.recurring === true &&
    Array.isArray(feeIssue.review_ids) &&
    new Set(feeIssue.review_ids).size >= 2;

  const bullets = recurring
    ? [
        "Customer feedback indicates recurring confusion about brokerage fees or deductions. This is an observed feedback theme, not proof of an incorrect charge.",
        "Groww lists brokerage charges for executed equity orders on its official pricing page. The applicable amount depends on the transaction.",
        "Selling delivery shares can also involve Depository Participant (DP) charges, which are separate from brokerage.",
        "Other applicable deductions may include Securities Transaction Tax (STT), exchange charges, SEBI charges, and GST.",
        "Check the order's contract note and detailed transaction report to understand the actual deductions.",
        "Before placing an order, review the estimated charges and consult Groww's official pricing page for current rates."
      ]
    : [
        "The uploaded reviews do not establish recurring confusion about the same trading fee.",
        "Brokerage and other transaction charges are explained on Groww's official pricing page.",
        "Delivery-share sales may involve DP charges in addition to brokerage.",
        "Statutory charges and taxes may also apply to transactions.",
        "Review the contract note for the exact charges associated with an order.",
        "Check Groww's official help and pricing pages before drawing conclusions about a deduction."
      ];

  return {
    title: "Groww Fee Explainer",
    bullets,
    recurringFeeIssue: recurring,
    supportingReviewIds: recurring
      ? [...new Set(feeIssue.review_ids)]
      : [],
    sources: OFFICIAL_SOURCES,
    lastChecked: "2026-10-21",
    disclaimer:
      "Educational explanation based on official Groww information. Actual charges depend on the transaction. Verify current rates and the contract note."
  };
}

module.exports = { generateFeeExplainer };
