import { connectDb } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { CaseModel } from "../src/models/Case.js";

const phishingDomains = ["secure-alerts.com", "verify-login.net", "bank-check.info"];
const safeDomains = ["github.com", "irs.gov", "ufl.edu"];
const types = ["email", "sms", "website"];
const difficulties = ["easy", "medium", "hard"];

function sample(arr, index) {
  return arr[index % arr.length];
}

function generateCase(i) {
  const isScam = i % 2 === 0;
  const contentType = sample(types, i);
  const difficulty = sample(difficulties, i);
  const domain = isScam ? sample(phishingDomains, i) : sample(safeDomains, i);

  return {
    title: `${contentType.toUpperCase()} Training Case #${i + 1}`,
    contentType,
    content: isScam
      ? `Urgent notice: your account will be suspended. Confirm identity at https://${domain}/login now.`
      : `Security reminder: review your account settings at https://${domain}/security when convenient.`,
    senderInfo: isScam ? `support@${domain}` : `help@${domain}`,
    links: [`https://${domain}/${isScam ? "login" : "security"}`],
    difficulty,
    correctAnswer: isScam ? "scam" : "safe",
    explanation: isScam
      ? "High pressure language, suspicious domain, and account threat indicators suggest phishing."
      : "Trusted domain and neutral wording with no urgent coercion indicate a safe example.",
    tags: isScam ? ["urgent", "account", "verification"] : ["official", "security", "notice"],
    isPublished: true,
  };
}

async function seed() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    console.error(
      'Seed blocked. Set ALLOW_DESTRUCTIVE_SEED=true if you intentionally want to reset case data.',
    );
    process.exit(1);
  }

  await connectDb(env.mongoUri);
  await CaseModel.deleteMany({});
  await CaseModel.insertMany(Array.from({ length: 120 }, (_, i) => generateCase(i)));

  console.log("Seed complete: inserted 120 cases");
  process.exit(0);
}

seed().catch((err) => {

  console.error(err);
  process.exit(1);
});
