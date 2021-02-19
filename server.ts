import "./config.js";
import express from "express";
import plaid from "plaid";
// import moment from "moment";
import admin from "firebase-admin";

const serviceAccount = process.env.SERVICE_ACCOUNT || "";
const port = process.env.PORT || 5000;
const clientID = process.env.CLIENT_ID || "";
const secret = process.env.SECRET || "";

console.log(serviceAccount);

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccount)),
});

const db = admin.firestore();

console.log(db.collection("users"));

const app = express();

app.listen(port, () => console.log(`Listening on port ${port}`));

const plaidClient = new plaid.Client({
  clientID,
  secret,
  env: plaid.environments.sandbox,
  options: { version: "2019-05-29" },
});

app.get("/getToken", (req, res) => {
  const id = req.query.id as string;
  // const email = req.query.email as string;
  plaidClient
    .createLinkToken({
      client_name: "week",
      language: "en",
      country_codes: ["US"],
      user: {
        client_user_id: id,
      },
      products: ["auth", "transactions"],
    })
    .then((r) => {
      console.log(r);
      const link_token = r.link_token;
      res.json({ link_token });
    })
    .catch((e) => {
      console.log(e);
      res.json({ error: e });
    });
});

type webhookType = "auth" | "transactions";

app.post("/webhook", (req, res) => {
  const { webhook_type: webhookType } = req.body;
  switch (webhookType.toLowerCase() as webhookType) {
    case "transactions":
      handleTransactionsWebhook(req.body);
  }
  res.json({ status: "ok" });
});
/**
 * Handles all transaction webhook events. The transaction webhook notifies
 * you that a single item has new transactions available.
 *
 * @param {Object} requestBody the request body of an incoming webhook event
 * @param {Object} io a socket.io server instance.
 */
const handleTransactionsWebhook = async (requestBody) => {
  const {
    webhook_code: webhookCode,
    item_id: plaidItemId,
    new_transactions: newTransactions,
    removed_transactions: removedTransactions,
  } = requestBody;

  switch (webhookCode) {
    case "INITIAL_UPDATE": {
      // Fired when an Item's initial transaction pull is completed.
      // Note: The default pull is 30 days.
      console.log("INITIAL UPDATE");
      console.log("INITIAL TRANSACTIONS: " + newTransactions);
      console.log("PLAID ITEM ID: " + plaidItemId);
      // const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
      // const endDate = moment().format("YYYY-MM-DD");
      break;
    }
    case "HISTORICAL_UPDATE": {
      // Fired when an Item's historical transaction pull is completed. Plaid fetches as much
      // data as is available from the financial institution.
      console.log("HISTORICAL UPDATE");
      console.log("HISTORICAL TRANSACTIONS: " + newTransactions);
      console.log("PLAID ITEM ID: " + plaidItemId);
      break;
    }
    case "DEFAULT_UPDATE": {
      // Fired when new transaction data is available as Plaid performs its regular updates of
      // the Item. Since transactions may take several days to post, we'll fetch 14 days worth of
      // transactions from Plaid and reconcile them with the transactions we already have stored.
      // const startDate = moment().subtract(14, "days").format("YYYY-MM-DD");
      // const endDate = moment().format("YYYY-MM-DD");
      console.log("DEFAULT UPDATE");
      console.log("NEW TRANSACTIONS: " + newTransactions);
      console.log("PLAID ITEM ID: " + plaidItemId);
      break;
    }
    case "TRANSACTIONS_REMOVED": {
      // Fired when posted transaction(s) for an Item are deleted. The deleted transaction IDs
      // are included in the webhook payload.
      console.log("TRANSACTIONS REMOVED");
      console.log("REMOVED TRANSACTIONS: " + removedTransactions);
      console.log("PLAID ITEM ID: " + plaidItemId);
      break;
    }
    default:
  }
};
