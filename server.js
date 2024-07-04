const express = require("express");
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

const port = 9000;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDQF4k7andl_i1Ef7s7maQNshI6Lx19Zsk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(bodyParser.urlencoded({ extended: true }));

const accounts = {};
const chat = [];
const testChat = [];

function generateAccountNumber() {
  return Math.floor(Math.random() * 9000) + 1000; // Generates a 10-digit number
}

// basic
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// /open-account
app.post("/open-account", (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== "string") {
    return res.status(400).send("Password is required and must be a string.");
  }

  const accountNum = generateAccountNumber().toString();
  accounts[accountNum] = { password, balance: 0 };
  res.json({ accountNum, password });
});

// /get-account-details
app.post("/get-account-details", (req, res) => {
  const { accountNum, password } = req.body;
  const account = accounts[accountNum];
  if (account && account.password === password) {
    res.json({ balance: account.balance });
  } else {
    res.status(401).send("Unauthorized");
  }
});

// /deposit-money
app.post("/deposit-money", (req, res) => {
  const { accountNum, password, amount } = req.body;
  const account = accounts[accountNum];
  if (account && account.password === password) {
    account.balance += amount;
    res.json({ balance: account.balance });
  } else {
    res.status(401).send("Unauthorized");
  }
});

// /transfer-money
app.post("/transfer-money", (req, res) => {
  const { accountNumFrom, password, amount, accountNumTo } = req.body;
  const accountFrom = accounts[accountNumFrom];
  const accountTo = accounts[accountNumTo];
  if (accountFrom && accountFrom.password === password && accountTo) {
    if (accountFrom.balance >= amount) {
      accountFrom.balance -= amount;
      accountTo.balance += amount;
      res.json({});
    } else {
      res.status(400).send("Insufficient funds");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});

// AIzaSyDQF4k7andl_i1Ef7s7maQNshI6Lx19Zsk
async function askAi(prompt) {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  console.log(prompt);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}

// /chat-to-ai
app.post("/chat-to-ai", async (req, res) => {
  const { accountNum, prompt } = req.body;
  const account = accounts[accountNum];
  if (account) {
    chat.push("user: " + prompt);

    const info = {
      background:
        "You are a bank teller at the Westpac bank. Provided is the new prompt from the user, the previous chatlog, and the user's current bank account balance. Talk in a nice, friendly and professional tone, keep the conversation going until the user terminates the conversation. Ask engaging questions.",
      prompt,
      chatlog: chat,
      account_balance: accounts[accountNum].balance,
    };

    JSON.stringify(info);

    const response = await askAi(JSON.stringify(info));

    chat.push("teller: response");

    res.json({ response });
  } else {
    res.status(401).send("Unauthorized");
  }
});

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  console.log("BODY: ", req.body);

  testChat.push("user: " + prompt);

  const info = {
    background:
      "You are a bank teller at the Westpac bank. Provided is the new prompt from the user, the previous chatlog, and the user's current bank account balance. Talk in a nice, friendly and professional tone, keep the conversation going until the user terminates the conversation. Ask engaging questions.",
    prompt: prompt,
    chatlog: testChat,
    account_balance: 10,
  };

  const response = await askAi(JSON.stringify(info));

  testChat.push(`teller: ${response}`);

  res.send(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
