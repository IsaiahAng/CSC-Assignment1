const express = require("express");
const app = express();
const path = require('path');

// Copy the .env.example in the root into a .env file in this folder
const envFilePath = path.resolve(__dirname, './.env');
const env = require("dotenv").config({ path: envFilePath });
if (env.error) {
  throw new Error(`Unable to load the .env file from ${envFilePath}. Please copy .env.example to ${envFilePath}`);
}

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get("/", (req, res) => {
  const filePath = path.resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(filePath);
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get("/checkout-session", async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

app.post("/create-checkout-session", async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { priceId } = req.body;

  // Create new Checkout Session for the order
  // Other optional params include:
  // [billing_address_collection] - to display billing address details on the page
  // [customer] - if you have an existing Stripe Customer ID
  // [customer_email] - lets you prefill the email input in the form
  // For full details see https://stripe.com/docs/api/checkout/sessions/create
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
      success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/canceled.html`,
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});

app.get("/setup", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    basicPrice: process.env.BASIC_PRICE_ID,
    proPrice: process.env.PRO_PRICE_ID,
  });
});

//Redirect to https://dashboard.stripe.com/test/subscriptions/sub_IfPqDZHYRa24T4 after subscribing


app.post('/customer-portal', async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID. 
  // Typically this is stored alongside the authenticated user in your database.
  const { sessionId } = req.body;
  const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = process.env.DOMAIN;
  console.log(returnUrl);

  const portalsession = await stripe.billingPortal.sessions.create({
    customer: checkoutsession.customer,
    return_url: returnUrl,
  });

  res.send({
    url: portalsession.url,
  });
});

// Webhook handler for asynchronous events.
app.post("/webhook", async (req, res) => {

  var mysql = require('mysql');

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "stripe testing"
  });

  let eventType;
  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === "checkout.session.completed") {
    console.log('Payment Suceeded');
    con.connect(function(err) {
      if (err) throw err;
      var sql = "INSERT INTO eventlistener (eventlistener,timestamp) VALUES ('New Charge',now())";
      con.query(sql, function (err, result) {
        if (err) throw err;
      });
    });
  }else if(eventType==="payment_intent.payment_failed"){
    console.log('Payment Failed');
    con.connect(function(err) {
      if (err) throw err;
      var sql = "INSERT INTO eventlistener (eventlistener,timestamp) VALUES ('Payment Failed',now())";
      con.query(sql, function (err, result) {
        if (err) throw err;
      });
    });
  }else if (eventType === "customer.subscription.deleted") {
    console.log('Subscription Cancelled');
    con.connect(function(err) {
      if(err) throw err;
      var sql = "INSERT INTO eventlistener (eventlistener,timestamp) VALUES ('Subscription Deleted',now())";
      con.query(sql, function (err, result) {
        if(err) throw err;
      });
    });
  }
  else if (eventType === "customer.subscription.updated") {
    console.log('Subscription Updated');
    con.connect(function(err) {
      if(err) throw err;
      var sql = "INSERT INTO eventlistener (eventlistener,timestamp) VALUES ('Subscription Updated',now())";
      con.query(sql, function (err, result) {
        if(err) throw err;
      });
    });
  }

  res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening at http://localhost:${4242}/`));
