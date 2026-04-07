import Stripe from "stripe";

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  const connectorName = "stripe";
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const environments = isProduction ? ["production", "development"] : ["development"];

  for (const targetEnvironment of environments) {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set("include_secrets", "true");
    url.searchParams.set("connector_names", connectorName);
    url.searchParams.set("environment", targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    });

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (
      connectionSettings &&
      connectionSettings.settings.publishable &&
      connectionSettings.settings.secret
    ) {
      return {
        publishableKey: connectionSettings.settings.publishable as string,
        secretKey: connectionSettings.settings.secret as string,
      };
    }
  }

  throw new Error("Stripe connection not found. Please configure Stripe in Replit integrations.");
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2024-06-20" as any });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}
