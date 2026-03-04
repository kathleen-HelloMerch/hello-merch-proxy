const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const DC = MAILCHIMP_API_KEY ? MAILCHIMP_API_KEY.split("-").pop() : "us1";

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Hello Merch Mailchimp Proxy running" });
});

// Proxy all Mailchimp API requests
app.all("/mailchimp/*", async (req, res) => {
  if (!MAILCHIMP_API_KEY) {
    return res.status(500).json({ error: "MAILCHIMP_API_KEY not set" });
  }

  const path = req.params[0];
  const query = new URLSearchParams(req.query).toString();
  const url = `https://${DC}.api.mailchimp.com/3.0/${path}${query ? "?" + query : ""}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": "Basic " + Buffer.from("anystring:" + MAILCHIMP_API_KEY).toString("base64"),
        "Content-Type": "application/json",
      },
      body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
