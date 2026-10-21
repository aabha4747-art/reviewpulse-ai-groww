
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/gmail.compose"
];

const pending = new Map();
const completed = new Set();

let oauthState = null;
let tokens = null;

const auditPath = path.join(
  __dirname,
  "..",
  "approval-audit.jsonl"
);

const frontendUrl = () =>
  process.env.CLIENT_URL || "http://localhost:5173";

function getOAuthClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  } = process.env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI
  ) {
    throw new Error(
      "Google OAuth credentials are missing in server/.env"
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

function getAuthorizedClient() {
  if (!tokens) {
    throw new Error("Connect your Google account first.");
  }

  const client = getOAuthClient();
  client.setCredentials(tokens);

  client.on("tokens", (newTokens) => {
    tokens = { ...tokens, ...newTokens };
  });

  return client;
}

function audit(event, details = {}) {
  fs.appendFileSync(
    auditPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...details
    }) + "\n"
  );
}

function safeText(value, max = 12000) {
  return String(value ?? "").slice(0, max);
}

function respondError(res, error) {
  console.error("Google integration error:", error);

  return res.status(400).json({
    success: false,
    message: error.message || "Google action failed."
  });
}

// -------------------------------------
// Connection status
// -------------------------------------

router.get("/status", (req, res) => {
  res.json({
    success: true,
    connected: Boolean(tokens)
  });
});

// -------------------------------------
// Start Google OAuth
// -------------------------------------

router.get("/connect", (req, res) => {
  try {
    oauthState = crypto.randomBytes(24).toString("hex");

    const url = getOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state: oauthState
    });

    return res.redirect(url);
  } catch (error) {
    return respondError(res, error);
  }
});

// -------------------------------------
// Google OAuth callback
// -------------------------------------

router.get("/callback", async (req, res) => {
  try {
    if (
      !oauthState ||
      typeof req.query.state !== "string" ||
      req.query.state !== oauthState
    ) {
      throw new Error("Invalid OAuth state. Connect again.");
    }

    oauthState = null;

    if (typeof req.query.code !== "string") {
      throw new Error("Google authorization was cancelled.");
    }

    const result = await getOAuthClient().getToken(
      req.query.code
    );

    tokens = result.tokens;

    audit("google_connected");

    return res.redirect(
      `${frontendUrl()}/?google_connected=1`
    );
  } catch (error) {
    return respondError(res, error);
  }
});

// -------------------------------------
// Prepare an action — no Google write
// -------------------------------------

router.post("/prepare", (req, res) => {
  try {
    const {
      type,
      pulse,
      feeExplainer,
      recipient
    } = req.body || {};

    if (!["document", "gmail_draft"].includes(type)) {
      throw new Error("Invalid action type.");
    }

    if (
      typeof pulse?.content !== "string" ||
      !pulse.content.trim()
    ) {
      throw new Error(
        "Generate the Weekly Product Pulse first."
      );
    }

    if (
      !Array.isArray(feeExplainer?.bullets) ||
      !feeExplainer.bullets.length
    ) {
      throw new Error(
        "Generate the Fee Explainer first."
      );
    }

    const body = [
      "ReviewPulse AI — Groww",
      "Product Intelligence Report",
      "",
      "WEEKLY PRODUCT PULSE",
      safeText(pulse.content, 8000),
      "",
      "FEE EXPLAINER",
      ...feeExplainer.bullets
        .slice(0, 6)
        .map((bullet, index) =>
          `${index + 1}. ${safeText(bullet, 1000)}`
        ),
      "",
      `Last checked: ${safeText(
        feeExplainer.lastChecked,
        50
      )}`,
      "",
      "OFFICIAL SOURCES",
      ...(feeExplainer.sources || [])
        .filter(
          (source) =>
            typeof source?.url === "string" &&
            /^https:\/\/groww\.in\//.test(source.url)
        )
        .slice(0, 5)
        .map(
          (source) =>
            `${safeText(source.title, 100)} — ${source.url}`
        ),
      "",
      safeText(feeExplainer.disclaimer, 1000),
      "",
      "Human review required.",
      "Synthetic test reviews are not genuine customer evidence."
    ].join("\n");

    const to = safeText(recipient, 254).trim();

    if (
      type === "gmail_draft" &&
      to &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
    ) {
      throw new Error("Enter a valid recipient email.");
    }

    const action = {
      id: crypto.randomUUID(),
      type,
      to,
      title: "ReviewPulse AI — Groww Weekly Product Pulse",
      body: body.slice(0, 25000),
      createdAt: Date.now()
    };

    pending.set(action.id, action);

    audit("prepared", {
      actionId: action.id,
      type
    });

    return res.json({
      success: true,
      preview: action
    });
  } catch (error) {
    return respondError(res, error);
  }
});

// -------------------------------------
// Approve and execute
// -------------------------------------

router.post("/approve", async (req, res) => {
  const { actionId, confirm } = req.body || {};

  const action = pending.get(actionId);

  if (!action || completed.has(actionId)) {
    return res.status(404).json({
      success: false,
      message: "Action unavailable. Prepare again."
    });
  }

  if (confirm !== true) {
    return res.status(400).json({
      success: false,
      message: "Explicit approval is required."
    });
  }

  if (Date.now() - action.createdAt > 600000) {
    pending.delete(actionId);

    return res.status(410).json({
      success: false,
      message: "Preview expired. Prepare again."
    });
  }

  completed.add(actionId);
  pending.delete(actionId);

  audit("approved", {
    actionId,
    type: action.type
  });

  try {
    const auth = getAuthorizedClient();
    let result;

    if (action.type === "document") {
      const docs = google.docs({
        version: "v1",
        auth
      });

      const created = await docs.documents.create({
        requestBody: {
          title: action.title
        }
      });

      const documentId = created.data.documentId;

      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                endOfSegmentLocation: {},
                text: action.body
              }
            }
          ]
        }
      });

      result = {
        type: "document",
        url:
          `https://docs.google.com/document/d/${documentId}/edit`
      };
    } else {
      const gmail = google.gmail({
        version: "v1",
        auth
      });

      const headers = [
        ...(action.to ? [`To: ${action.to}`] : []),
        `Subject: ${action.title}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        ""
      ].join("\r\n");

      const mime =
        headers +
        "\r\n" +
        Buffer.from(
          action.body,
          "utf8"
        ).toString("base64");

      const raw = Buffer.from(
        mime,
        "utf8"
      ).toString("base64url");

      const created = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: { raw }
        }
      });

      result = {
        type: "gmail_draft",
        draftId: created.data.id,
        url: "https://mail.google.com/mail/u/0/#drafts"
      };
    }

    audit("succeeded", {
      actionId,
      type: action.type,
      ...result
    });

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    audit("failed", {
      actionId,
      type: action.type,
      reason: safeText(error.message, 300)
    });

    return respondError(res, error);
  }
});

// -------------------------------------
// Reject action
// -------------------------------------

router.post("/reject", (req, res) => {
  const actionId = req.body?.actionId;
  const action = pending.get(actionId);

  if (!action) {
    return res.status(404).json({
      success: false,
      message: "Preview not found."
    });
  }

  pending.delete(actionId);

  audit("rejected", {
    actionId,
    type: action.type
  });

  return res.json({
    success: true
  });
});

module.exports = router;
