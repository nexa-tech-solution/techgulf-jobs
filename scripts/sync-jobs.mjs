import { visaOffer } from "./visa-sponsorship.mjs";
// Syncs real jobs from public ATS APIs into Firestore.
//   npm run sync:jobs -- --dry-run                 preview, no credentials needed, writes nothing
//   npm run sync:jobs                              write jobs, delete expired ones (run this daily)
//   npm run sync:jobs -- --remove-demo             also delete demo jobs (those not created by this script)
//   npm run sync:jobs -- --dry-run --company=careem
// Writing needs GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json (in the shell or .env)
//
// Each run deletes synced jobs that left the employer's board, passed MAX_AGE_DAYS,
// or belong to a company removed from SOURCES, so the collection cannot grow without limit.

// To add a company: find its board slug on its careers page and add one line.
const SOURCES = [
  { ats: "greenhouse", board: "careem", slug: "careem", industry: "Super-app / Mobility", about: "Super-app for rides, food delivery and payments across the Middle East.", domain: "careem.com", name: "Careem", color: "#16a34a", hq: "Dubai, UAE" },
  { ats: "greenhouse", board: "tamara", slug: "tamara", industry: "Fintech / BNPL", about: "Buy-now-pay-later and payments platform for shoppers in the GCC.", domain: "tamara.co", name: "Tamara", color: "#7c3aed", hq: "Riyadh, Saudi Arabia" },
  { ats: "greenhouse", board: "groww", slug: "groww", industry: "Fintech / Investing", about: "Investing app for stocks and mutual funds in India.", domain: "groww.in", name: "Groww", color: "#00b386", hq: "Bengaluru, India" },
  { ats: "ashby", board: "ziina", slug: "ziina", industry: "Fintech / Payments", about: "Payments app for people and small businesses in the UAE.", domain: "ziina.com", name: "Ziina", color: "#0f766e", hq: "Dubai, UAE" },
  { ats: "lever", board: "cred", slug: "cred", industry: "Fintech", about: "Credit card bill payments and rewards app for India.", domain: "cred.club", name: "CRED", color: "#1f2937", hq: "Bengaluru, India" },
  { ats: "lever", board: "meesho", slug: "meesho", industry: "E-commerce", about: "Online marketplace for value shoppers and small sellers in India.", domain: "meesho.com", name: "Meesho", color: "#9f2089", hq: "Bengaluru, India" },
  { ats: "workable", board: "salla", slug: "salla", industry: "E-commerce SaaS", about: "Platform for building and running online stores in Saudi Arabia.", domain: "salla.com", name: "Salla", color: "#004d5a", hq: "Riyadh, Saudi Arabia" },
  { ats: "workable", board: "lucidya", slug: "lucidya", industry: "AI / Customer experience", about: "AI platform for customer experience and social listening, with a focus on Arabic.", domain: "lucidya.com", name: "Lucidya", color: "#4f46e5", hq: "Riyadh, Saudi Arabia" },
  { ats: "workable", board: "foodics", slug: "foodics", industry: "Restaurant SaaS", about: "Cloud point-of-sale and restaurant management platform.", domain: "foodics.com", name: "Foodics", color: "#7c3aed", hq: "Riyadh, Saudi Arabia" },
  { ats: "ashby", board: "leantech", slug: "lean-technologies", industry: "Fintech / Open banking", about: "Open banking and payment infrastructure for the Middle East.", name: "Lean Technologies", color: "#0f172a", hq: "Riyadh, Saudi Arabia" },
  { ats: "greenhouse", board: "bybit", slug: "bybit", industry: "Crypto exchange", about: "Cryptocurrency exchange for spot and derivatives trading.", domain: "bybit.com", name: "Bybit", color: "#d97706", hq: "Dubai, UAE" },
  { ats: "greenhouse", board: "binance", slug: "binance", industry: "Crypto exchange", about: "Large global cryptocurrency exchange and blockchain company.", domain: "binance.com", name: "Binance", color: "#ca8a04", hq: "Global" },
  { ats: "greenhouse", board: "deliveroo", slug: "deliveroo", industry: "Food delivery", about: "Food and grocery delivery platform with a tech hub in India.", domain: "deliveroo.com", name: "Deliveroo", color: "#0d9488", hq: "London, UK" },
  { ats: "greenhouse", board: "coinbase", slug: "coinbase", industry: "Crypto exchange", about: "Cryptocurrency exchange and financial infrastructure company.", domain: "coinbase.com", name: "Coinbase", color: "#2563eb", hq: "Remote" },
  { ats: "greenhouse", board: "inmobi", slug: "inmobi", industry: "Advertising technology", about: "Mobile advertising and marketing technology company.", domain: "inmobi.com", name: "InMobi", color: "#db2777", hq: "Bengaluru, India" },
  { ats: "smartrecruiters", board: "Freshworks", slug: "freshworks", industry: "SaaS", about: "Customer and employee engagement software.", domain: "freshworks.com", name: "Freshworks", color: "#ea580c", hq: "San Mateo, USA" },
  { ats: "smartrecruiters", board: "Swiggy", slug: "swiggy", industry: "Food delivery", about: "Food and grocery delivery platform in India.", domain: "swiggy.com", name: "Swiggy", color: "#f97316", hq: "Bengaluru, India" },
  { ats: "lever", board: "zeta", slug: "zeta", industry: "Banking technology", about: "Cloud-native banking and payments technology for banks.", domain: "zeta.tech", name: "Zeta", color: "#7e22ce", hq: "Bengaluru, India" },
  { ats: "lever", board: "paytm", slug: "paytm", industry: "Fintech / Payments", about: "Digital payments and financial services company in India.", domain: "paytm.com", name: "Paytm", color: "#0284c7", hq: "Noida, India" },
  { ats: "greenhouse", board: "thoughtworks", slug: "thoughtworks", domain: "thoughtworks.com", name: "Thoughtworks", color: "#be123c", hq: "Chicago, USA", industry: "Technology consulting", about: "Global software consultancy that builds products for large organisations." },
  { ats: "greenhouse", board: "mongodb", slug: "mongodb", domain: "mongodb.com", name: "MongoDB", color: "#15803d", hq: "New York, USA", industry: "Databases", about: "Company behind the MongoDB document database and Atlas cloud service." },
  { ats: "greenhouse", board: "gitlab", slug: "gitlab", domain: "gitlab.com", name: "GitLab", color: "#ea580c", hq: "Remote", industry: "Developer tools", about: "DevSecOps platform for building, securing and shipping software." },
  { ats: "greenhouse", board: "databricks", slug: "databricks", domain: "databricks.com", name: "Databricks", color: "#dc2626", hq: "San Francisco, USA", industry: "Data and AI", about: "Data and AI platform built around the lakehouse architecture." },
  { ats: "greenhouse", board: "stripe", slug: "stripe", domain: "stripe.com", name: "Stripe", color: "#4f46e5", hq: "San Francisco, USA", industry: "Fintech / Payments", about: "Payments and financial infrastructure for internet businesses." },
  { ats: "greenhouse", board: "twilio", slug: "twilio", domain: "twilio.com", name: "Twilio", color: "#e11d48", hq: "San Francisco, USA", industry: "Communications APIs", about: "Cloud APIs for messaging, voice and customer engagement." },
  { ats: "ashby", board: "snowflake", slug: "snowflake", domain: "snowflake.com", name: "Snowflake", color: "#0284c7", hq: "Bozeman, USA", industry: "Data and AI", about: "Cloud data platform for storing, sharing and analysing data." },
  { ats: "smartrecruiters", board: "endava", slug: "endava", domain: "endava.com", name: "Endava", color: "#ea580c", hq: "London, UK", industry: "Technology consulting", about: "Technology services company focused on digital transformation." },
  { ats: "greenhouse", board: "turing", slug: "turing", domain: "turing.com", name: "Turing", color: "#2563eb", hq: "Palo Alto, USA", industry: "AI / Talent platform", about: "AI company that also matches developers with remote roles." },
  { ats: "lever", board: "mindtickle", slug: "mindtickle", domain: "mindtickle.com", name: "Mindtickle", color: "#7c3aed", hq: "San Francisco, USA", industry: "SaaS", about: "Revenue enablement platform for sales teams." },
  { ats: "greenhouse", board: "druva", slug: "druva", domain: "druva.com", name: "Druva", color: "#0369a1", hq: "Santa Clara, USA", industry: "Data security", about: "Cloud platform for data protection and backup." },
  { ats: "smartrecruiters", board: "wise", slug: "wise", domain: "wise.com", name: "Wise", color: "#65a30d", hq: "London, UK", industry: "Fintech / Payments", about: "International money transfer and multi-currency accounts." },
  { ats: "greenhouse", board: "agoda", slug: "agoda", domain: "agoda.com", name: "Agoda", color: "#2563eb", hq: "Singapore", industry: "Travel technology", about: "Online travel platform for hotels and flights." },
  { ats: "greenhouse", board: "airbnb", slug: "airbnb", domain: "airbnb.com", name: "Airbnb", color: "#e11d48", hq: "San Francisco, USA", industry: "Travel technology", about: "Marketplace for stays and experiences." },
  { ats: "greenhouse", board: "elastic", slug: "elastic", domain: "elastic.co", name: "Elastic", color: "#0891b2", hq: "Remote", industry: "Search and observability", about: "Company behind Elasticsearch, for search, observability and security." },
  { ats: "greenhouse", board: "rubrik", slug: "rubrik", domain: "rubrik.com", name: "Rubrik", color: "#0d9488", hq: "Palo Alto, USA", industry: "Data security", about: "Cloud data protection and cyber resilience platform." },
  { ats: "greenhouse", board: "okta", slug: "okta", domain: "okta.com", name: "Okta", color: "#1d4ed8", hq: "San Francisco, USA", industry: "Identity and security", about: "Identity platform for securing workforce and customer logins." },
  { ats: "greenhouse", board: "sumologic", slug: "sumo-logic", domain: "sumologic.com", name: "Sumo Logic", color: "#1e40af", hq: "Redwood City, USA", industry: "Observability", about: "Log analytics platform for reliability and security teams." },
  { ats: "ashby", board: "cohere", slug: "cohere", domain: "cohere.com", name: "Cohere", color: "#6d28d9", hq: "Toronto, Canada", industry: "Data and AI", about: "Enterprise AI models and tools for search and text generation." },
  { ats: "ashby", board: "openai", slug: "openai", domain: "openai.com", name: "OpenAI", color: "#0f766e", hq: "San Francisco, USA", industry: "Data and AI", about: "AI research company behind ChatGPT and the OpenAI API." },
  { ats: "lever", board: "nium", slug: "nium", domain: "nium.com", name: "Nium", color: "#7c3aed", hq: "Singapore", industry: "Fintech / Payments", about: "Global payments infrastructure for banks and businesses." },
  { ats: "greenhouse", board: "samsara", slug: "samsara", domain: "samsara.com", name: "Samsara", color: "#2563eb", hq: "San Francisco, USA", industry: "Industrial IoT", about: "Connected operations platform for fleets and physical industries." },
  { ats: "greenhouse", board: "hackerrank", slug: "hackerrank", domain: "hackerrank.com", name: "HackerRank", color: "#15803d", hq: "Santa Clara, USA", industry: "Developer tools", about: "Coding assessments and technical hiring platform." },
  { ats: "smartrecruiters", board: "grab", slug: "grab", domain: "grab.com", name: "Grab", color: "#16a34a", hq: "Singapore", industry: "Super-app / Mobility", about: "Super-app for rides, deliveries and payments in Southeast Asia." },
  { ats: "greenhouse", board: "toast", slug: "toast", domain: "toasttab.com", name: "Toast", color: "#ea580c", hq: "Boston, USA", industry: "Restaurant SaaS", about: "Point-of-sale and management platform for restaurants." },
  { ats: "greenhouse", board: "starburst", slug: "starburst", domain: "starburst.io", name: "Starburst", color: "#0284c7", hq: "Boston, USA", industry: "Data and AI", about: "Data analytics platform built on the Trino query engine." },
  { ats: "greenhouse", board: "singlestore", slug: "singlestore", domain: "singlestore.com", name: "SingleStore", color: "#9333ea", hq: "San Francisco, USA", industry: "Databases", about: "Distributed SQL database for real-time applications." },
  { ats: "ashby", board: "clickhouse", slug: "clickhouse", domain: "clickhouse.com", name: "ClickHouse", color: "#ca8a04", hq: "San Francisco, USA", industry: "Databases", about: "Open-source column-oriented database for analytics." },
  { ats: "greenhouse", board: "fivetran", slug: "fivetran", domain: "fivetran.com", name: "Fivetran", color: "#2563eb", hq: "Oakland, USA", industry: "Data and AI", about: "Automated data movement into warehouses and lakes." },
  { ats: "greenhouse", board: "purestorage", slug: "pure-storage", domain: "purestorage.com", name: "Pure Storage", color: "#ea580c", hq: "Santa Clara, USA", industry: "Data storage", about: "All-flash data storage hardware and software." },
  { ats: "greenhouse", board: "zscaler", slug: "zscaler", domain: "zscaler.com", name: "Zscaler", color: "#0369a1", hq: "San Jose, USA", industry: "Cybersecurity", about: "Cloud security platform built on zero trust access." },
  { ats: "greenhouse", board: "commvault", slug: "commvault", domain: "commvault.com", name: "Commvault", color: "#4f46e5", hq: "Tinton Falls, USA", industry: "Data security", about: "Data protection and recovery across cloud and on-premises systems." },
  { ats: "smartrecruiters", board: "servicenow", slug: "servicenow", domain: "servicenow.com", name: "ServiceNow", color: "#15803d", hq: "Santa Clara, USA", industry: "SaaS", about: "Cloud platform for automating IT and business workflows." },
  { ats: "greenhouse", board: "payoneer", slug: "payoneer", domain: "payoneer.com", name: "Payoneer", color: "#ea580c", hq: "New York, USA", industry: "Fintech / Payments", about: "Cross-border payments for businesses and freelancers." },
  { ats: "greenhouse", board: "scaleai", slug: "scale-ai", domain: "scale.com", name: "Scale AI", color: "#4f46e5", hq: "San Francisco, USA", industry: "Data and AI", about: "Data and tooling for building and evaluating AI models." },
  { ats: "greenhouse", board: "anthropic", slug: "anthropic", domain: "anthropic.com", name: "Anthropic", color: "#b45309", hq: "San Francisco, USA", industry: "Data and AI", about: "AI safety and research company behind Claude." },
  { ats: "lever", board: "crypto", slug: "crypto-com", domain: "crypto.com", name: "Crypto.com", color: "#1e3a8a", hq: "Singapore", industry: "Crypto exchange", about: "Cryptocurrency exchange and payments app." },
  { ats: "greenhouse", board: "jfrog", slug: "jfrog", domain: "jfrog.com", name: "JFrog", color: "#15803d", hq: "Sunnyvale, USA", industry: "Developer tools", about: "Software supply chain and artifact management platform." },
  { ats: "ashby", board: "elevenlabs", slug: "elevenlabs", domain: "elevenlabs.io", name: "ElevenLabs", color: "#0f172a", hq: "New York, USA", industry: "Data and AI", about: "AI voice generation and audio tools." },
  { ats: "smartrecruiters", board: "DeliveryHero", slug: "delivery-hero", domain: "deliveryhero.com", name: "Delivery Hero", color: "#dc2626", hq: "Berlin, Germany", industry: "Food delivery", about: "Food delivery group behind Talabat and HungerStation in the Gulf." },
  { ats: "recruitee", board: "unifonic", slug: "unifonic", domain: "unifonic.com", name: "Unifonic", color: "#4f46e5", hq: "Riyadh, Saudi Arabia", industry: "Communications APIs", about: "Customer messaging and engagement platform for the Middle East." },
  { ats: "greenhouse", board: "glance", slug: "glance", domain: "glance.com", name: "Glance", color: "#7c3aed", hq: "Bengaluru, India", industry: "Consumer technology", about: "AI-led content and commerce platform for smartphone lock screens." },
  { ats: "greenhouse", board: "observeai", slug: "observe-ai", domain: "observe.ai", name: "Observe.AI", color: "#2563eb", hq: "San Francisco, USA", industry: "Data and AI", about: "AI platform for contact centre conversations." },
  { ats: "ashby", board: "gainsight", slug: "gainsight", domain: "gainsight.com", name: "Gainsight", color: "#ea580c", hq: "San Francisco, USA", industry: "SaaS", about: "Customer success and retention software." },
  { ats: "workday", board: "adobe:wd5:external_experienced", slug: "adobe", domain: "adobe.com", name: "Adobe", color: "#dc2626", hq: "San Jose, USA", industry: "Software", about: "Creative, document and marketing software." },
  { ats: "workday", board: "aveva:wd3:AVEVA_careers", slug: "aveva", domain: "aveva.com", name: "AVEVA", color: "#0369a1", hq: "Cambridge, UK", industry: "Industrial software", about: "Engineering and operations software for industry." },
  { ats: "workday", board: "boeing:wd1:EXTERNAL_CAREERS", slug: "boeing", domain: "boeing.com", name: "Boeing", color: "#1d4ed8", hq: "Arlington, USA", industry: "Aerospace", about: "Aerospace manufacturer with engineering centres in India." },
  { ats: "workday", board: "broadcom:wd1:External_Career", slug: "broadcom", domain: "broadcom.com", name: "Broadcom", color: "#b91c1c", hq: "Palo Alto, USA", industry: "Semiconductors", about: "Semiconductors and infrastructure software." },
  { ats: "workday", board: "citi:wd5:2", slug: "citi", domain: "citi.com", name: "Citi", color: "#1d4ed8", hq: "New York, USA", industry: "Banking", about: "Global bank with large technology centres in India." },
  { ats: "workday", board: "crowdstrike:wd5:crowdstrikecareers", slug: "crowdstrike", domain: "crowdstrike.com", name: "CrowdStrike", color: "#dc2626", hq: "Austin, USA", industry: "Cybersecurity", about: "Cloud platform for endpoint and identity security." },
  { ats: "workday", board: "db:wd3:DBWebsite", slug: "deutsche-bank", domain: "db.com", name: "Deutsche Bank", color: "#1e3a8a", hq: "Frankfurt, Germany", industry: "Banking", about: "Global bank with technology centres in India." },
  { ats: "workday", board: "genesys:wd1:Genesys", slug: "genesys", domain: "genesys.com", name: "Genesys", color: "#ea580c", hq: "Menlo Park, USA", industry: "SaaS", about: "Cloud contact centre software." },
  { ats: "workday", board: "hp:wd5:ExternalCareerSite", slug: "hp", domain: "hp.com", name: "HP", color: "#0284c7", hq: "Palo Alto, USA", industry: "Hardware", about: "Personal computers, printers and related services." },
  { ats: "workday", board: "hpe:wd5:Jobsathpe", slug: "hpe", domain: "hpe.com", name: "Hewlett Packard Enterprise", color: "#15803d", hq: "Houston, USA", industry: "Enterprise technology", about: "Servers, networking and hybrid cloud." },
  { ats: "workday", board: "intel:wd1:External", slug: "intel", domain: "intel.com", name: "Intel", color: "#0369a1", hq: "Santa Clara, USA", industry: "Semiconductors", about: "Processor and semiconductor manufacturer." },
  { ats: "workday", board: "kla:wd1:Search", slug: "kla", domain: "kla.com", name: "KLA", color: "#1d4ed8", hq: "Milpitas, USA", industry: "Semiconductors", about: "Inspection and process control systems for chipmaking." },
  { ats: "workday", board: "lowes:wd5:LWS_External_CS", slug: "lowes", domain: "lowes.com", name: "Lowe's", color: "#1e3a8a", hq: "Mooresville, USA", industry: "Retail technology", about: "Home improvement retailer with a technology centre in Bengaluru." },
  { ats: "workday", board: "mastercard:wd1:CorporateCareers", slug: "mastercard", domain: "mastercard.com", name: "Mastercard", color: "#ea580c", hq: "Purchase, USA", industry: "Fintech / Payments", about: "Global payments network and technology company." },
  { ats: "workday", board: "micron:wd1:External", slug: "micron", domain: "micron.com", name: "Micron", color: "#1d4ed8", hq: "Boise, USA", industry: "Semiconductors", about: "Memory and storage chip manufacturer." },
  { ats: "workday", board: "motorolasolutions:wd5:Careers", slug: "motorola-solutions", domain: "motorolasolutions.com", name: "Motorola Solutions", color: "#0f172a", hq: "Chicago, USA", industry: "Communications technology", about: "Critical communications and public safety technology." },
  { ats: "workday", board: "nvidia:wd5:NVIDIAExternalCareerSite", slug: "nvidia", domain: "nvidia.com", name: "NVIDIA", color: "#65a30d", hq: "Santa Clara, USA", industry: "Semiconductors", about: "GPUs and computing platforms for AI and graphics." },
  { ats: "workday", board: "paypal:wd1:jobs", slug: "paypal", domain: "paypal.com", name: "PayPal", color: "#1d4ed8", hq: "San Jose, USA", industry: "Fintech / Payments", about: "Online payments and digital wallets." },
  { ats: "workday", board: "philips:wd3:jobs-and-careers", slug: "philips", domain: "philips.com", name: "Philips", color: "#0369a1", hq: "Amsterdam, Netherlands", industry: "Health technology", about: "Medical devices and health technology." },
  { ats: "workday", board: "pwc:wd3:Global_Experienced_Careers", slug: "pwc", domain: "pwc.com", name: "PwC", color: "#ea580c", hq: "London, UK", industry: "Technology consulting", about: "Professional services with technology and SAP practices." },
  { ats: "workday", board: "salesforce:wd12:External_Career_Site", slug: "salesforce", domain: "salesforce.com", name: "Salesforce", color: "#0284c7", hq: "San Francisco, USA", industry: "SaaS", about: "Customer relationship management software." },
  { ats: "workday", board: "target:wd5:targetcareers", slug: "target", domain: "target.com", name: "Target", color: "#dc2626", hq: "Minneapolis, USA", industry: "Retail technology", about: "US retailer with a technology centre in Bengaluru." },
  { ats: "workday", board: "unilever:wd3:Unilever_Experienced_Professionals", slug: "unilever", domain: "unilever.com", name: "Unilever", color: "#1d4ed8", hq: "London, UK", industry: "Consumer goods", about: "Consumer goods company with data and digital teams in India." },
  { ats: "workday", board: "wf:wd1:WellsFargoJobs", slug: "wells-fargo", domain: "wellsfargo.com", name: "Wells Fargo", color: "#b91c1c", hq: "San Francisco, USA", industry: "Banking", about: "US bank with technology centres in India." },
  { ats: "workday", board: "workday:wd5:Workday", slug: "workday", domain: "workday.com", name: "Workday", color: "#ea580c", hq: "Pleasanton, USA", industry: "SaaS", about: "Cloud software for finance and human resources." },
  { ats: "greenhouse", board: "celonis", slug: "celonis", domain: "celonis.com", name: "Celonis", color: "#15803d", hq: "Munich, Germany", industry: "Data and AI", about: "Process mining and process intelligence software." },
  { ats: "ashby", board: "uipath", slug: "uipath", domain: "uipath.com", name: "UiPath", color: "#ea580c", hq: "New York, USA", industry: "SaaS", about: "Automation platform for business processes." },
  { ats: "ashby", board: "tekion", slug: "tekion", domain: "tekion.com", name: "Tekion", color: "#1d4ed8", hq: "Pleasanton, USA", industry: "SaaS", about: "Cloud platform for automotive retail." },
  { ats: "greenhouse", board: "razorpaysoftwareprivatelimited", slug: "razorpay", domain: "razorpay.com", name: "Razorpay", color: "#1d4ed8", hq: "Bengaluru, India", industry: "Fintech / Payments", about: "Payments and banking platform for businesses in India." },
  { ats: "smartrecruiters", board: "BoschGroup", slug: "bosch", domain: "bosch.com", name: "Bosch", color: "#dc2626", hq: "Gerlingen, Germany", industry: "Engineering and technology", about: "Engineering group with large software centres in India." },
  { ats: "smartrecruiters", board: "Experian", slug: "experian", domain: "experian.com", name: "Experian", color: "#7c3aed", hq: "Dublin, Ireland", industry: "Data and analytics", about: "Credit data and analytics company." },
  { ats: "smartrecruiters", board: "WesternDigital", slug: "western-digital", domain: "westerndigital.com", name: "Western Digital", color: "#1d4ed8", hq: "San Jose, USA", industry: "Data storage", about: "Hard drives and data storage products." },
  { ats: "smartrecruiters", board: "NielsenIQ", slug: "nielseniq", domain: "nielseniq.com", name: "NielsenIQ", color: "#0369a1", hq: "Chicago, USA", industry: "Data and analytics", about: "Consumer and retail market data." },
  { ats: "workday", board: "sprinklr:wd1:careers", slug: "sprinklr", domain: "sprinklr.com", name: "Sprinklr", color: "#0284c7", hq: "New York, USA", industry: "SaaS", about: "Customer experience management software." },
  { ats: "workday", board: "equinix:wd1:External", slug: "equinix", domain: "equinix.com", name: "Equinix", color: "#dc2626", hq: "Redwood City, USA", industry: "Data centres", about: "Global data centre and interconnection company." },
  { ats: "workday", board: "lseg:wd3:Careers", slug: "lseg", domain: "lseg.com", name: "LSEG", color: "#0f172a", hq: "London, UK", industry: "Financial data", about: "Financial markets data and infrastructure." },
  { ats: "workday", board: "fiserv:wd5:EXT", slug: "fiserv", domain: "fiserv.com", name: "Fiserv", color: "#ea580c", hq: "Milwaukee, USA", industry: "Fintech / Payments", about: "Payments and financial services technology." },
  { ats: "workday", board: "statestreet:wd1:Global", slug: "state-street", domain: "statestreet.com", name: "State Street", color: "#1e3a8a", hq: "Boston, USA", industry: "Banking", about: "Asset servicing and financial services." },
  { ats: "workday", board: "shell:wd3:ShellCareers", slug: "shell", domain: "shell.com", name: "Shell", color: "#ca8a04", hq: "London, UK", industry: "Energy", about: "Energy company with digital and data teams in India." },
  { ats: "workday", board: "marvell:wd1:MarvellCareers", slug: "marvell", domain: "marvell.com", name: "Marvell", color: "#dc2626", hq: "Santa Clara, USA", industry: "Semiconductors", about: "Chips for data infrastructure." },
  { ats: "workday", board: "ciena:wd5:Careers", slug: "ciena", domain: "ciena.com", name: "Ciena", color: "#0369a1", hq: "Hanover, USA", industry: "Networking", about: "Optical networking systems and software." },
  { ats: "workday", board: "nxp:wd3:careers", slug: "nxp", domain: "nxp.com", name: "NXP", color: "#ca8a04", hq: "Eindhoven, Netherlands", industry: "Semiconductors", about: "Chips for cars, industry and connected devices." },
  { ats: "workday", board: "athenahealth:wd1:External", slug: "athenahealth", domain: "athenahealth.com", name: "athenahealth", color: "#7c3aed", hq: "Boston, USA", industry: "Health technology", about: "Cloud software for healthcare providers." },
  { ats: "workday", board: "trimble:wd1:TrimbleCareers", slug: "trimble", domain: "trimble.com", name: "Trimble", color: "#1d4ed8", hq: "Westminster, USA", industry: "Industrial software", about: "Positioning and software for construction and transport." },
  { ats: "workday", board: "thomsonreuters:wd5:External_Career_Site", slug: "thomson-reuters", domain: "thomsonreuters.com", name: "Thomson Reuters", color: "#ea580c", hq: "Toronto, Canada", industry: "Information services", about: "Software and information for legal, tax and news." },
  { ats: "workday", board: "vanguard:wd5:vanguard_external", slug: "vanguard", domain: "vanguard.com", name: "Vanguard", color: "#b91c1c", hq: "Malvern, USA", industry: "Financial services", about: "Investment management company with a technology centre in India." },
  { ats: "workday", board: "capitalone:wd12:Capital_One", slug: "capital-one", domain: "capitalone.com", name: "Capital One", color: "#1e3a8a", hq: "McLean, USA", industry: "Banking", about: "US bank with technology teams in India." },
  { ats: "workday", board: "kone:wd3:Careers", slug: "kone", domain: "kone.com", name: "KONE", color: "#1d4ed8", hq: "Espoo, Finland", industry: "Engineering and technology", about: "Elevators, escalators and building technology." },
  { ats: "workday", board: "aptiv:wd5:APTIV_CAREERS", slug: "aptiv", domain: "aptiv.com", name: "Aptiv", color: "#ea580c", hq: "Schaffhausen, Switzerland", industry: "Automotive technology", about: "Software and electronics for vehicles." },
  { ats: "workday", board: "nasdaq:wd1:Global_External_Site", slug: "nasdaq", domain: "nasdaq.com", name: "Nasdaq", color: "#0284c7", hq: "New York, USA", industry: "Financial technology", about: "Stock exchange operator and market technology." },
  { ats: "workday", board: "blackrock:wd1:BlackRock_Professional", slug: "blackrock", domain: "blackrock.com", name: "BlackRock", color: "#0f172a", hq: "New York, USA", industry: "Financial services", about: "Asset manager behind the Aladdin technology platform." },
  { ats: "workable", board: "shipa", slug: "shipa", domain: "shipa.com", name: "Shipa", color: "#dc2626", hq: "Dubai, UAE", industry: "Logistics technology", about: "Delivery and logistics technology in the Middle East." },
  { ats: "recruitee", board: "keyper", slug: "keyper", domain: "keyper.com", name: "Keyper", color: "#0f766e", hq: "Dubai, UAE", industry: "Proptech", about: "Rent-now-pay-later and home financing platform in the UAE." },
  { ats: "workable", board: "alpheya", slug: "alpheya", domain: "alpheya.com", name: "Alpheya", color: "#1e3a8a", hq: "Abu Dhabi, UAE", industry: "Fintech", about: "Wealth management technology platform." },
  { ats: "ashby", board: "thndr", slug: "thndr", domain: "thndr.app", name: "Thndr", color: "#7c3aed", hq: "Cairo, Egypt", industry: "Fintech / Investing", about: "Investing app for retail investors in the Middle East." },
];

// Older postings are usually stale even if still listed. Matches validThrough in the job page's JSON-LD.
const MAX_AGE_DAYS = 60;

const WORKDAY_MARKETS = ["India", "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"];
const WORKDAY_MAX_PER_MARKET = 100;

const BOARD_URL = {
  greenhouse: (b) => `https://boards.greenhouse.io/${b}`,
  lever: (b) => `https://jobs.lever.co/${b}`,
  ashby: (b) => `https://jobs.ashbyhq.com/${b}`,
  smartrecruiters: (b) => `https://jobs.smartrecruiters.com/${b}`,
  workable: (b) => `https://apply.workable.com/${b}`,
  recruitee: (b) => `https://${b}.recruitee.com`,
  workday: (b) => { const [tenant, wd, site] = b.split(":"); return `https://${tenant}.${wd}.myworkdayjobs.com/${site}`; },
};

const PLACES = [
  ["AE", /\b(uae|u\.a\.e|united arab emirates|dubai|abu dhabi|sharjah|ajman)\b/i, ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"]],
  ["SA", /\b(saudi|ksa|riyadh|jeddah|dammam|khobar)\b/i, ["Riyadh", "Jeddah", "Dammam", "Khobar"]],
  ["QA", /\b(qatar|doha)\b/i, ["Doha"]],
  ["KW", /\b(kuwait)\b/i, ["Kuwait City"]],
  ["OM", /\b(oman|muscat)\b/i, ["Muscat"]],
  ["BH", /\b(bahrain|manama)\b/i, ["Manama"]],
  ["IN", /\b(india|bengaluru|bangalore|mumbai|pune|gurugram|gurgaon|hyderabad|chennai|noida|delhi)\b/i, ["Bengaluru", "Bangalore", "Mumbai", "Pune", "Gurugram", "Gurgaon", "Hyderabad", "Chennai", "Noida", "Delhi"]],
];

// First match wins. Jobs matching nothing are not tech roles and are skipped.
const CATEGORIES = [
  ["security", /\b(security|soc analyst|cyber|appsec|infosec)\b/i],
  ["data-ai", /\b(data (engineer(ing)?|scien\w*|analy\w*)|machine learning|ml engineer|mlops|\bai\b|llm|analytics engineer|business intelligence)\b/i],
  ["devops", /\b(devops|sre|site reliability|platform engineer|infrastructure|cloud engineer)\b/i],
  ["qa", /\b(qa|sdet|test engineer|quality engineer|automation engineer)\b/i],
  ["erp", /\b(sap|oracle fusion|erp|dynamics 365)\b/i],
  ["network", /\b(network engineer|network administrator)\b/i],
  ["support", /\b(it support|helpdesk|help desk|technical support)\b/i],
  ["product", /\b(product manager|technical program manager|product owner)\b/i],
  ["frontend", /\b(front[- ]?end|react|angular|android|ios|flutter|mobile (engineer|developer))\b/i],
  ["backend", /\b(back[- ]?end|full[- ]?stack|software (engineer|developer)|sde|engineering manager|java|golang|node\.?js|\.net|python developer)\b/i],
];

const NON_TECH = /\b(sales|pre-?sales|market research|account executive|account manager|marketing|recruit\w*|talent|legal|finance|account(ant|ing)|customer success|business development|hr|human resources|martech|regional security)\b/i;

const TAGS = ["React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Kotlin", "Swift", "Go", "Rust", ".NET", "C#", "Flutter", "Android", "iOS", "AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "Kafka", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Spark", "Databricks", "PyTorch", "TensorFlow", "LLM", "SQL", "SAP", "Selenium", "Cypress"];
// "Go" must not match prose such as "Go-to-market" or "Go to".
const tagRe = (t) => (t === "Go"
  ? /(^|[^A-Za-z0-9+#.])Go(?![- ]to\b)($|[^A-Za-z0-9+#])/
  : new RegExp(`(^|[^a-z0-9+#.])${t.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9+#])`, "i"));

const toText = (html = "") => html
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
  .replace(/<\/(p|div|h[1-6]|ul|ol)>|<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "- ")
  .replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const CITY_ALIAS = { Bangalore: "Bengaluru", Gurgaon: "Gurugram" };

function seniorityOf(title) {
  if (/\b(intern|internship|graduate|new grad|trainee)\b/i.test(title)) return "intern";
  if (/\b(lead|staff|principal|head|manager|director|architect|vice president|vp|chief|ciso|cto)\b/i.test(title) && !/\bassociate (product |project |program )?manager\b/i.test(title)) return "lead";
  if (/\b(junior|jr\.?|associate)\b/i.test(title)) return "junior";
  // Numbered grades: "Engineer III" and "SDE 3" are senior, "Engineer I" is junior.
  if (/\b(senior|sr\.?|iii|iv|sde[- ]?3)\b/i.test(title) || /\bengineer\s+[34]\b/i.test(title)) return "senior";
  if (/\b(engineer|developer|analyst)\s+(i|1)\b/i.test(title)) return "junior";
  return "mid";
}

// "Remote - Canada" is not open to someone in Dubai, so only unrestricted or regional remote counts.
function isOpenRemote(location, remote) {
  if (!remote && !/\bremote\b/i.test(location)) return false;
  const rest = location.replace(/\b(fully|remote)\b|[-,–()]/gi, "").trim();
  return !rest || /^(global|worldwide|anywhere|mena|middle east|gcc)$/i.test(rest);
}

function placeOf(location, remote) {
  for (const [country, re, cities] of PLACES) {
    if (re.test(location)) {
      // A posting can list several cities, so take the one named first rather than the first in our list.
      const city = cities
        .map((c) => [c, location.search(new RegExp(`\\b${c}\\b`, "i"))])
        .filter(([, at]) => at >= 0)
        .sort((a, b) => a[1] - b[1])[0]?.[0];
      return { country, city: CITY_ALIAS[city] ?? city };
    }
  }
  return isOpenRemote(location, remote) ? { country: "REMOTE" } : null;
}

const fetchers = {
  async greenhouse(board) {
    const { jobs } = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
    return jobs.map((j) => ({
      sourceId: j.id, title: j.title, location: j.location?.name ?? "", url: j.absolute_url,
      postedAt: j.first_published ?? j.updated_at, description: toText(j.content),
    }));
  },
  async lever(board) {
    const jobs = await getJson(`https://api.lever.co/v0/postings/${board}?mode=json`);
    return jobs.map((j) => ({
      sourceId: j.id, title: j.text, location: (j.categories?.allLocations ?? [j.categories?.location]).filter(Boolean).join(", "), url: j.hostedUrl,
      postedAt: new Date(j.createdAt).toISOString(), workplace: j.workplaceType,
      description: [j.descriptionPlain, ...(j.lists ?? []).map((l) => `${l.text}\n${toText(l.content)}`), j.additionalPlain].filter(Boolean).join("\n\n"),
      salary: leverSalary(j.salaryRange),
    }));
  },
  async ashby(board) {
    const { jobs } = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
    return jobs.filter((j) => j.isListed !== false).map((j) => ({
      sourceId: j.id, title: j.title, location: [j.location, ...(j.secondaryLocations ?? []).map((l) => l.location)].filter(Boolean).join(", "), url: j.jobUrl,
      postedAt: j.publishedAt, workplace: j.workplaceType, remote: j.isRemote, description: j.descriptionPlain ?? toText(j.descriptionHtml),
    }));
  },
  async smartrecruiters(board) {
    const base = `https://api.smartrecruiters.com/v1/companies/${board}/postings`;
    const list = [];
    for (let offset = 0; ; offset += 100) {
      const page = await getJson(`${base}?limit=100&offset=${offset}`);
      list.push(...page.content);
      if (!page.content.length || list.length >= page.totalFound) break;
    }
    const located = list.map((j) => ({ ...j, place: [j.location?.city, COUNTRY_NAME[j.location?.country] ?? j.location?.country].filter(Boolean).join(", ") }));
    // Descriptions need one request per job, so fetch them only for jobs that will be kept.
    const wanted = located.filter((j) => isTech(j.name) && placeOf(j.place, j.location?.remote));
    const raw = [];
    for (const j of wanted) {
      const full = await getJson(`${base}/${j.id}`);
      raw.push({
        sourceId: j.id, title: j.name, location: j.place, url: full.postingUrl, postedAt: j.releasedDate, remote: j.location?.remote,
        description: Object.values(full.jobAd?.sections ?? {}).map((s) => `${s.title ?? ""}\n${toText(s.text)}`).join("\n\n"),
      });
    }
    return Object.assign(raw, { listed: list.length });
  },
  async recruitee(board) {
    const { offers } = await getJson(`https://${board}.recruitee.com/api/offers/`);
    return offers.map((j) => ({
      sourceId: j.id, title: j.title, location: [j.location, j.city, j.country].filter(Boolean).join(", "), url: j.careers_url,
      postedAt: j.published_at, remote: j.remote, description: toText(`${j.description ?? ""}\n${j.requirements ?? ""}`),
    }));
  },
  // board = "tenant:wd5:site". Workday has no "all jobs" feed for a region, so search each target market.
  async workday(board) {
    const [tenant, wd, site] = board.split(":");
    const host = `https://${tenant}.${wd}.myworkdayjobs.com`;
    const api = `${host}/wday/cxs/${tenant}/${site}`;
    const found = new Map();
    let listed = 0;
    for (const searchText of WORKDAY_MARKETS) {
      for (let offset = 0; offset < WORKDAY_MAX_PER_MARKET; offset += 20) {
        const page = await postJson(`${api}/jobs`, { appliedFacets: {}, limit: 20, offset, searchText });
        listed += page.jobPostings?.length ?? 0;
        for (const j of page.jobPostings ?? []) if (j.externalPath && isTech(j.title)) found.set(j.externalPath, j);
        if (!page.jobPostings?.length || offset + 20 >= (page.total ?? 0)) break;
      }
    }
    const raw = [];
    for (const path of found.keys()) {
      const { jobPostingInfo: j } = await getJson(`${api}${path}`);
      if (!j) continue;
      raw.push({
        sourceId: j.jobReqId ?? path.split("/").pop(), title: j.title, url: j.externalUrl ?? `${host}/${site}${path}`,
        location: [j.location, j.additionalLocations?.join(", "), j.country?.descriptor].filter(Boolean).join(", "),
        postedAt: j.startDate, remote: /remote/i.test(j.remoteType ?? ""), description: toText(j.jobDescription),
      });
    }
    return Object.assign(raw, { listed });
  },
  async workable(board) {
    const { jobs } = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${board}?details=true`);
    return jobs.map((j) => ({
      sourceId: j.shortcode, title: j.title, location: [j.city, j.state, j.country].filter(Boolean).join(", "), url: j.url,
      postedAt: j.published_on ?? j.created_at, remote: j.telecommuting, description: toText(j.description),
    }));
  },
};

function leverSalary(r) {
  const period = { "per-year-salary": "year", "per-month-salary": "month" }[r?.interval];
  return period && r.currency ? { min: r.min, max: r.max, currency: r.currency, period } : undefined;
}

// Workable rate-limits after a few boards, so wait and retry rather than skip the company.
async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function getJson(url, retries = 4) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  if (res.status === 429 && retries > 0) {
    const wait = Number(res.headers.get("retry-after")) || 15 * (5 - retries);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    return getJson(url, retries - 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

const COUNTRY_NAME = { ae: "United Arab Emirates", sa: "Saudi Arabia", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain", in: "India" };
const categoryOf = (title) => (NON_TECH.test(title) ? undefined : CATEGORIES.find(([, re]) => re.test(title))?.[0]);
const isTech = (title) => !!categoryOf(title);

function toJob(raw, source) {
  const category = categoryOf(raw.title);
  const place = placeOf(raw.location, raw.remote);
  // Without a real link or date the job cannot be traced to its source, so it is not published.
  if (!category || !place || !raw.url || !raw.postedAt) return null;
  if (Date.now() - new Date(raw.postedAt).getTime() > MAX_AGE_DAYS * 864e5) return null;
  const workplace = `${raw.workplace ?? ""} ${raw.location} ${raw.title}`;
  return {
    id: `${source.ats}-${source.board}-${raw.sourceId}`,
    source: source.ats, sourceId: String(raw.sourceId),
    company: source.name, companySlug: source.slug, title: raw.title,
    location: raw.location, ...(place.city && { city: place.city }), country: place.country,
    mode: place.country === "REMOTE" || raw.remote || /remote/i.test(workplace) ? "remote" : /hybrid/i.test(workplace) ? "hybrid" : "onsite",
    seniority: seniorityOf(raw.title), category,
    tags: TAGS.filter((t) => tagRe(t).test(`${raw.title}\n${raw.description}`)).slice(0, 8),
    ...(raw.salary && { salary: raw.salary }),
    visaSponsored: !!visaOffer(raw.description),
    // The APIs do not state these. False means "not stated", never inferred.
    nationalsPreferred: false, directEmployer: true,
    description: raw.description, applyUrl: raw.url,
    postedAt: new Date(raw.postedAt).toISOString(), status: "active", synced: true,
  };
}

// Only the link is stored: the browser loads the icon, and nothing is downloaded here.
const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const removeDemo = args.includes("--remove-demo");
const only = args.find((a) => a.startsWith("--company="))?.split("=")[1];
const sources = SOURCES.filter((s) => !only || s.slug === only);
if (!sources.length) throw new Error(`Unknown company: ${only}`);

let db = null;
if (!dryRun) {
  const { applicationDefault, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: "techgulf-jobs" }));
}

// A source without these would show an empty company card, so stop before touching anything.
const incomplete = SOURCES.filter((s) => !s.industry || !s.about).map((s) => s.slug);
if (incomplete.length) throw new Error(`Add industry and about to SOURCES: ${incomplete.join(", ")}`);

// Written together and first, so a failed source or an interrupted run cannot leave companies incomplete.
if (db) {
  const batch = db.batch();
  for (const source of sources) {
    batch.set(db.collection("companies").doc(source.slug), {
      slug: source.slug, name: source.name, color: source.color, hq: source.hq,
      industry: source.industry, about: source.about,
      ats: source.ats, careersUrl: BOARD_URL[source.ats](source.board),
      // No domain means no usable icon, so the company keeps its letter avatar.
      ...(source.domain && { logo: logoUrl(source.domain) }),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Updated ${sources.length} companies`);
}

let failed = 0;
let total = 0;
for (const source of sources) {
  try {
    const raw = await fetchers[source.ats](source.board);
    // One posting listed in several cities has one id, so keep it once.
    const jobs = [...new Map(raw.map((r) => toJob(r, source)).filter(Boolean).map((j) => [j.id, j])).values()];
    console.log(`${source.name}: ${raw.listed ?? raw.length} fetched, ${jobs.length} kept`);
    total += jobs.length;

    if (dryRun) {
      for (const j of jobs.filter((x) => x.visaSponsored)) console.log(`  VISA ${j.title}: ${visaOffer(j.description).trim().slice(0, 200)}`);
      for (const j of jobs.slice(0, 3)) console.log(`  [${j.category}/${j.country}/${j.city ?? "-"}/${j.mode}] ${j.title}\n    ${j.applyUrl}`);
      continue;
    }

    const writer = db.bulkWriter();
    // Merge keeps notifiedAt, which the email digest uses to tell new jobs from old.
    for (const j of jobs) writer.set(db.collection("jobs").doc(j.id), j, { merge: true });

    // An empty response may be an API fault, so only a non-empty result can delete jobs.
    let deleted = 0;
    if (raw.listed ?? raw.length) {
      const live = new Set(jobs.map((j) => j.id));
      const existing = await db.collection("jobs").where("companySlug", "==", source.slug).where("synced", "==", true).get();
      for (const doc of existing.docs) {
        if (!live.has(doc.id)) { writer.delete(doc.ref); deleted++; }
      }
    }
    await writer.close();
    if (deleted) console.log(`  deleted ${deleted} jobs that expired or left the board`);
  } catch (err) {
    failed++;
    console.error(`${source.name}: FAILED, existing jobs left untouched. ${err.message}`);
  }
}

// A company dropped from SOURCES is no longer refreshed, so nothing else would ever remove its jobs.
if (db && !only) {
  const known = new Set(SOURCES.map((s) => s.slug));
  const synced = await db.collection("jobs").where("synced", "==", true).select("companySlug").get();
  const orphans = synced.docs.filter((d) => !known.has(d.get("companySlug")));
  if (orphans.length) {
    const writer = db.bulkWriter();
    for (const d of orphans) writer.delete(d.ref);
    await writer.close();
    console.log(`Deleted ${orphans.length} jobs from companies no longer in SOURCES`);
  }
}

console.log(`Done: ${total} jobs kept from ${sources.length - failed}/${sources.length} sources`);

if (removeDemo) {
  if (dryRun) console.log("--remove-demo ignored in dry run");
  else if (failed) console.log("--remove-demo skipped because a source failed");
  else {
    const all = await db.collection("jobs").get();
    const demo = all.docs.filter((d) => d.get("synced") !== true);
    const writer = db.bulkWriter();
    for (const d of demo) writer.delete(d.ref);
    await writer.close();
    console.log(`Removed ${demo.length} demo jobs`);
  }
}

if (failed) process.exitCode = 1;
