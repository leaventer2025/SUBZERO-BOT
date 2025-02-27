/* const config = require('../config');
const { cmd, commands } = require('../command');


const axios = require("axios");
const BASE_URL = "https://www.1secmail.com/api/v1/";

let tempEmails = {}; // Store temporary emails per user

cmd({
  pattern: "tempmail",
  alias: ["tm", "mailtemp"],
  desc: "Generate and fetch temporary emails.",
  category: "utility",
  use: ".tempmail [new | inbox | read <ID>]",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    console.log("Received tempmail command from:", from, "with args:", args);
    const action = args[0] ? args[0].toLowerCase() : "new";

    if (action === "new") {
      console.log("Generating new temporary email...");
      const randomName = Math.random().toString(36).substring(2, 10);
      const domainList = ["1secmail.com", "1secmail.org", "1secmail.net"];
      const domain = domainList[Math.floor(Math.random() * domainList.length)];
      const email = `${randomName}@${domain}`;
      tempEmails[from] = email;
      console.log("Generated temp email:", email);
      return reply(`📩 *Your Temporary Email:* ${email}\n\nUse .tempmail inbox to check received emails.`);
    }
    
    if (action === "inbox") {
      if (!tempEmails[from]) {
        console.log("User has no active temp email.");
        return reply("❌ You don't have an active temp email. Use `.tempmail new` to generate one.");
      }
      
      console.log("Fetching inbox for:", tempEmails[from]);
      const [login, domain] = tempEmails[from].split("@");
      const inboxUrl = `${BASE_URL}?action=getMessages&login=${login}&domain=${domain}`;
      const inboxResponse = await axios.get(inboxUrl);
      const emails = inboxResponse.data;
      
      console.log("Inbox response:", emails);
      if (!emails || emails.length === 0) {
        return reply("📭 No new emails in your temporary inbox.");
      }
      
      let messageList = "📨 *Inbox Messages:*\n\n";
      for (let mail of emails) {
        messageList += `📧 From: ${mail.from}\n📌 Subject: ${mail.subject}\n🆔 ID: ${mail.id}\n\n`;
      }
      
      return reply(messageList + "\nUse `.tempmail read <ID>` to read an email.");
    }
    
    if (action === "read") {
      const emailId = args[1];
      if (!emailId) {
        console.log("No email ID provided.");
        return reply("❌ Provide an email ID. Example: `.tempmail read 12345`");
      }
      if (!tempEmails[from]) {
        console.log("User has no active temp email.");
        return reply("❌ You don't have an active temp email. Use `.tempmail new` first.");
      }
      
      console.log("Fetching email with ID:", emailId);
      const [login, domain] = tempEmails[from].split("@");
      const emailUrl = `${BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${emailId}`;
      const emailResponse = await axios.get(emailUrl);
      
      console.log("Email read response:", emailResponse.data);
      if (!emailResponse.data || !emailResponse.data.subject) return reply("❌ Invalid email ID or email no longer exists.");
      
      return reply(`📧 *Email from:* ${emailResponse.data.from}\n📌 *Subject:* ${emailResponse.data.subject}\n📩 *Message:* ${emailResponse.data.body}`);
    }
    
    console.log("Invalid option provided.");
    return reply("❌ Invalid option. Use `.tempmail new`, `.tempmail inbox`, or `.tempmail read <ID>`");
  } catch (error) {
    console.error("Error with temp mail plugin:", error);
    reply("❌ Failed to process request. Try again later.");
  }
});
*/

const axios = require('axios');
const { cmd } = require('../command');

const BASE_URL = 'https://www.guerrillamail.com/ajax.php';
let userSessions = {}; // Store session data per user

cmd({
  pattern: 'tempmail',
  alias: ['tm', 'mailtemp'],
  desc: 'Generate and fetch temporary emails.',
  category: 'utility',
  use: '.tempmail [new | inbox | read <ID>]',
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const action = args[0] ? args[0].toLowerCase() : 'new';

    if (action === 'new') {
      // Generate a new temporary email
      const response = await axios.get(`${BASE_URL}?f=get_email_address`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const { email_addr, sid_token } = response.data;
      userSessions[from] = { email: email_addr, sid_token };
      return reply(`📩 *Your Temporary Email:* ${email_addr}\n\nUse .tempmail inbox to check received emails.`);
    }

    if (!userSessions[from]) {
      return reply('❌ You don\'t have an active temp email. Use `.tempmail new` to generate one.');
    }

    const { email, sid_token } = userSessions[from];

    if (action === 'inbox') {
      // Check the inbox for the current temporary email
      const response = await axios.get(`${BASE_URL}?f=get_email_list&sid_token=${sid_token}&offset=0`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const emails = response.data.list;
      if (!emails || emails.length === 0) {
        return reply('📭 No new emails in your temporary inbox.');
      }
      let messageList = '📨 *Inbox Messages:*\n\n';
      emails.forEach(mail => {
        messageList += `🆔 ID: ${mail.mail_id}\n📧 From: ${mail.mail_from}\n📌 Subject: ${mail.mail_subject}\n\n`;
      });
      return reply(messageList + 'Use `.tempmail read <ID>` to read an email.');
    }

    if (action === 'read') {
      const emailId = args[1];
      if (!emailId) {
        return reply('❌ Provide an email ID. Example: `.tempmail read 12345`');
      }
      // Read a specific email by ID
      const response = await axios.get(`${BASE_URL}?f=fetch_email&sid_token=${sid_token}&email_id=${emailId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const mail = response.data;
      if (!mail || !mail.mail_subject) {
        return reply('❌ Invalid email ID or email no longer exists.');
      }
      return reply(`📧 *Email from:* ${mail.mail_from}\n📌 *Subject:* ${mail.mail_subject}\n📩 *Message:* ${mail.mail_body}`);
    }

    return reply('❌ Invalid option. Use `.tempmail new`, `.tempmail inbox`, or `.tempmail read <ID>`');
  } catch (error) {
    console.error('Error with temp mail plugin:', error);
    reply('❌ Failed to process request. Try again later.');
  }
});
