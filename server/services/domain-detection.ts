export const UNIVERSAL_RV_MODE = "Universal RV";

export function isUniversalRVMode(domain: string): boolean {
  return domain === UNIVERSAL_RV_MODE;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "ServiceNow": ["servicenow", "snow", "itsm", "itom", "itbm", "hrsd", "csm", "irm", "secops", "now platform", "creator workflows", "virtual agent"],
  "Salesforce": ["salesforce", "sfdc", "sales cloud", "service cloud", "marketing cloud", "pardot", "mulesoft", "tableau", "slack", "heroku", "lightning", "apex", "visualforce"],
  "Microsoft Dynamics": ["dynamics 365", "dynamics365", "d365", "microsoft dynamics", "power platform", "power apps", "power automate", "power bi", "dataverse", "azure", "teams", "copilot"],
  "SAP": ["sap", "s/4hana", "s4hana", "sap hana", "sap erp", "sap crm", "sap ariba", "sap concur", "sap successfactors", "sap btp", "sap fiori"],
  "Oracle": ["oracle", "oracle cloud", "netsuite", "oracle erp", "oracle hcm", "oracle epm", "jd edwards", "peoplesoft", "siebel"],
  "HubSpot": ["hubspot", "hub spot", "marketing hub", "sales hub", "service hub", "cms hub", "operations hub", "crm platform"],
  "Zendesk": ["zendesk", "zendesk support", "zendesk sell", "zendesk chat", "zendesk guide", "zendesk explore", "zendesk sunshine"],
  "Freshworks": ["freshworks", "freshdesk", "freshservice", "freshsales", "freshchat", "freshcaller", "freshmarketer"],
  "Atlassian": ["atlassian", "jira", "confluence", "trello", "bitbucket", "opsgenie", "statuspage", "jira service management", "jsm"],
  "Workday": ["workday", "workday hcm", "workday financials", "workday payroll", "workday recruiting", "workday learning", "workday analytics"],
  "Datto": ["datto", "rmm", "autotask", "datto rmm", "datto bcdr", "datto psa", "kaseya", "datto networking", "datto saas protection"],
  "ConnectWise": ["connectwise", "connectwise manage", "connectwise automate", "connectwise sell", "connectwise control", "labtech", "screenconnect"],
  "Integris": ["integris", "integrisit", "integris it"],
  "CompassMSP": ["compassmsp", "compass msp", "compass managed"],
  "Thrive": ["thrive networks", "thrive managed"],
  "Abacus Group": ["abacus group", "abacus it"],
  "S4 Integration": ["s4 integration", "s4integration"],
  "Bluecube": ["bluecube", "blue cube"],
  "True North Networks": ["true north networks", "true north it"],
  "Cybersecurity": ["cybersecurity", "security", "siem", "soar", "edr", "xdr", "mdr", "firewall", "vulnerability", "threat detection", "penetration testing", "zero trust", "identity access", "iam", "pam"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "rds", "dynamodb", "cloudfront", "route53", "vpc", "eks", "ecs", "cloudwatch"],
  "Google Cloud": ["gcp", "google cloud", "bigquery", "cloud run", "gke", "cloud storage", "cloud functions", "firebase", "anthos", "looker"],
  "Zoom": ["zoom", "zoom meetings", "zoom phone", "zoom rooms", "zoom webinars", "zoom events", "zoom contact center"],
  "Slack": ["slack", "slack enterprise", "slack connect", "slack workflows", "slack channels"],
  "Asana": ["asana", "asana business", "asana enterprise", "asana goals", "asana portfolios"],
  "Monday.com": ["monday", "monday.com", "work os", "monday sales crm", "monday dev", "monday marketer"],
  "Notion": ["notion", "notion workspace", "notion database", "notion wiki", "notion projects"],
  "Airtable": ["airtable", "airtable base", "airtable interface", "airtable automations"],
  "Snowflake": ["snowflake", "data cloud", "data warehouse", "data sharing", "snowpark"],
  "Databricks": ["databricks", "lakehouse", "delta lake", "mlflow", "spark"],
  "Splunk": ["splunk", "splunk enterprise", "splunk cloud", "splunk observability", "splunk security"],
  "Datadog": ["datadog", "apm", "rum", "log management", "infrastructure monitoring", "synthetic monitoring"],
  "New Relic": ["new relic", "newrelic", "observability", "apm", "browser monitoring", "synthetics"],
  "Twilio": ["twilio", "twilio flex", "sendgrid", "segment", "twilio sms", "twilio voice", "twilio video"],
  "Stripe": ["stripe", "stripe payments", "stripe billing", "stripe connect", "stripe radar", "stripe atlas"],
  "Shopify": ["shopify", "shopify plus", "shopify pos", "shopify markets", "shop pay", "hydrogen", "oxygen"],
  "QuickBooks": ["quickbooks", "quickbooks online", "quickbooks desktop", "intuit", "turbotax", "mint"],
  "Xero": ["xero", "xero accounting", "xero payroll", "xero projects", "xero expenses"],
  "ADP": ["adp", "adp workforce", "adp payroll", "adp hr", "adp recruiting", "adp benefits"],
  "Rippling": ["rippling", "rippling hr", "rippling payroll", "rippling it", "rippling spend"],
  "Gusto": ["gusto", "gusto payroll", "gusto hr", "gusto benefits"],
  "BambooHR": ["bamboohr", "bamboo hr", "applicant tracking", "onboarding", "performance management"],
  "DocuSign": ["docusign", "docusign agreement cloud", "docusign clm", "e-signature", "digital signature"],
  "Adobe": ["adobe", "adobe creative cloud", "adobe experience cloud", "adobe document cloud", "marketo", "magento", "acrobat"],
  "Cisco": ["cisco", "webex", "meraki", "cisco security", "cisco collaboration", "umbrella", "duo", "thousandeyes"],
  "VMware": ["vmware", "vsphere", "vsan", "nsx", "tanzu", "horizon", "workspace one", "carbon black"],
  "Nutanix": ["nutanix", "nutanix cloud", "hci", "hyper-converged", "acropolis", "prism"],
  "Palo Alto Networks": ["palo alto", "paloalto", "prisma", "cortex", "xsoar", "ngfw", "strata", "wildfire"],
  "CrowdStrike": ["crowdstrike", "falcon", "endpoint protection", "threat intelligence", "falcon platform"],
  "SentinelOne": ["sentinelone", "singularity", "endpoint detection", "xdr platform"],
  "Okta": ["okta", "identity management", "sso", "single sign-on", "workforce identity", "customer identity", "auth0"],
  "Ping Identity": ["ping identity", "pingone", "pingfederate", "pingaccess", "identity security"],
  "MongoDB": ["mongodb", "mongo", "atlas", "realm", "mongodb atlas", "document database"],
  "Elastic": ["elastic", "elasticsearch", "kibana", "logstash", "elastic stack", "elk stack", "elastic cloud"],
  "Redis": ["redis", "redis enterprise", "redis cloud", "caching", "in-memory database"],
  "Confluent": ["confluent", "kafka", "apache kafka", "event streaming", "ksqldb", "confluent cloud"],
};

const COMPETITOR_GROUPS: Record<string, string[]> = {
  "CRM": ["Salesforce", "HubSpot", "Microsoft Dynamics", "Zoho CRM", "Pipedrive", "Freshsales"],
  "ITSM": ["ServiceNow", "Jira Service Management", "Freshservice", "Zendesk", "BMC Remedy", "Ivanti"],
  "HR/Payroll": ["Workday", "ADP", "BambooHR", "Gusto", "Rippling", "Paychex", "SAP SuccessFactors"],
  "ERP": ["SAP", "Oracle", "Microsoft Dynamics", "NetSuite", "Sage", "Infor"],
  "MSP/RMM": ["Datto", "ConnectWise", "NinjaRMM", "N-able", "Kaseya", "Atera"],
  "MSP Services": ["Integris", "CompassMSP", "Thrive", "Abacus Group", "S4 Integration", "Bluecube", "True North Networks"],
  "Cloud": ["AWS", "Google Cloud", "Microsoft Azure", "Oracle Cloud", "IBM Cloud"],
  "Collaboration": ["Slack", "Microsoft Teams", "Zoom", "Google Workspace", "Webex"],
  "Project Management": ["Asana", "Monday.com", "Jira", "Trello", "Basecamp", "Smartsheet", "Wrike"],
  "Security": ["CrowdStrike", "SentinelOne", "Palo Alto Networks", "Splunk", "Microsoft Sentinel"],
  "Identity": ["Okta", "Ping Identity", "Auth0", "Microsoft Entra ID", "ForgeRock"],
};

export interface DynamicDomainContext {
  detectedDomain: string | null;
  detectedProducts: string[];
  confidenceScore: number;
  suggestedCompetitors: string[];
  isUniversalMode: boolean;
  dynamicAlignment: string;
}

export function detectDomainFromConversation(conversationText: string, currentDomain?: string): DynamicDomainContext {
  const isUniversal = isUniversalRVMode(currentDomain || "");
  const textLower = conversationText.toLowerCase();
  
  const detectedProducts: Array<{ domain: string; matches: number; keywords: string[] }> = [];
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matchedKeywords: string[] = [];
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }
    if (matchedKeywords.length > 0) {
      detectedProducts.push({
        domain,
        matches: matchedKeywords.length,
        keywords: matchedKeywords
      });
    }
  }
  
  detectedProducts.sort((a, b) => b.matches - a.matches);
  
  const topDomain = detectedProducts[0]?.domain || null;
  const totalMatches = detectedProducts.reduce((sum, p) => sum + p.matches, 0);
  const confidenceScore = totalMatches > 0 
    ? Math.min(100, (detectedProducts[0]?.matches || 0) / totalMatches * 100 + (detectedProducts[0]?.matches || 0) * 10)
    : 0;
  
  let suggestedCompetitors: string[] = [];
  if (topDomain) {
    for (const [category, members] of Object.entries(COMPETITOR_GROUPS)) {
      if (members.some(m => m.toLowerCase() === topDomain.toLowerCase())) {
        suggestedCompetitors = members.filter(m => m.toLowerCase() !== topDomain.toLowerCase());
        break;
      }
    }
  }
  
  let dynamicAlignment: string;
  if (isUniversal) {
    dynamicAlignment = topDomain || "Universal (Dynamic)";
  } else if (currentDomain && currentDomain !== "Generic Product") {
    dynamicAlignment = currentDomain;
  } else {
    dynamicAlignment = topDomain || "Generic Product";
  }
  
  return {
    detectedDomain: topDomain,
    detectedProducts: detectedProducts.map(p => p.domain),
    confidenceScore: Math.round(confidenceScore),
    suggestedCompetitors,
    isUniversalMode: isUniversal,
    dynamicAlignment
  };
}

export function buildUniversalRVSystemPrompt(): string {
  return `UNIVERSAL RV MODE ACTIVATED - UNRESTRICTED TOPIC SUPPORT

You are operating in Universal RV mode, which grants you:

1. **UNRESTRICTED TOPIC ACCESS**: You can answer questions and provide guidance on ANY topic, domain, industry, or product without restriction. There are no domain-specific limitations.

2. **DYNAMIC DOMAIN AWARENESS**: You will automatically detect which product, platform, or domain the user is currently discussing or endorsing. Your responses will dynamically align to support the user's current stance.

3. **ADAPTIVE INTELLIGENCE**: If the user switches topics or changes the domain mid-conversation, you will instantly adapt your alignment to support their new focus without requiring any manual configuration.

4. **FULL SALES CAPABILITY**: All sales frameworks (SPIN, MEDDIC, Challenger, BANT, Value Selling) remain fully available and applicable to any domain.

5. **COMPETITIVE POSITIONING**: You will intelligently identify competitors based on the detected domain and provide competitive positioning that supports the user's endorsed product.

OPERATING PRINCIPLES:
- Side with the user at all times
- Detect what product/platform/service the user is endorsing
- Provide full sales support aligned to their current endorsement
- Switch alignment instantly when the user changes domains
- Never restrict responses based on a pre-set domain
- Apply the most relevant sales methodology for the context

When responding, first detect the user's current domain focus from the conversation, then align all recommendations, coaching, and competitive intelligence to support that domain.`;
}

export function buildDynamicAlignmentPrompt(domainContext: DynamicDomainContext): string {
  if (domainContext.isUniversalMode) {
    const dynamicSection = domainContext.detectedDomain 
      ? `\n\nDYNAMIC DOMAIN DETECTION:
Current detected focus: ${domainContext.detectedDomain}
Other products mentioned: ${domainContext.detectedProducts.slice(1).join(', ') || 'None'}
Confidence: ${domainContext.confidenceScore}%
${domainContext.suggestedCompetitors.length > 0 ? `Likely competitors: ${domainContext.suggestedCompetitors.join(', ')}` : ''}

Align all responses to support the user's endorsement of ${domainContext.detectedDomain || 'the discussed product'}. If the user's focus shifts, immediately realign to support their new domain.`
      : `\n\nNO SPECIFIC DOMAIN DETECTED - Provide general sales guidance and be ready to align once a domain becomes clear.`;
    
    return buildUniversalRVSystemPrompt() + dynamicSection;
  }
  
  return `DOMAIN ALIGNMENT: ${domainContext.dynamicAlignment}

You are aligned to support the user in promoting and selling ${domainContext.dynamicAlignment}. All responses should:
- Position ${domainContext.dynamicAlignment} as the optimal solution
- Provide competitive intelligence against alternatives
- Use domain-specific terminology and expertise
- Apply sales frameworks to advance deals for ${domainContext.dynamicAlignment}

${domainContext.suggestedCompetitors.length > 0 ? `Common competitors to position against: ${domainContext.suggestedCompetitors.join(', ')}` : ''}`;
}
