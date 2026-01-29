import { db } from "../db";
import { products, caseStudies, implementationPlaybooks, promptTemplates } from "../../shared/schema";

async function seedKnowledgeBase() {
  console.log("🌱 Seeding knowledge base...");

  const sampleProducts = [
    {
      code: "CRM-PRO",
      name: "Professional CRM Suite",
      category: "Customer Relationship Management",
      description: "Complete customer relationship management platform with sales pipeline, contact management, and analytics",
      keyFeatures: [
        "360-degree customer view",
        "Sales pipeline management",
        "Email integration",
        "Custom reporting dashboards",
        "Mobile app access",
        "AI-powered lead scoring"
      ],
      useCases: [
        "B2B sales teams managing complex deals",
        "Account management and relationship tracking",
        "Sales forecasting and pipeline analysis"
      ],
      targetIndustries: ["Technology", "Professional Services", "Manufacturing", "Healthcare"],
      pricingModel: "Per user per month",
      typicalPrice: "$49-99/user/month",
      implementationTime: "2-4 weeks",
      integratesWith: ["EMAIL-SYNC", "ANALYTICS-PRO", "API-PLATFORM"],
      isActive: true,
    },
    {
      code: "ANALYTICS-PRO",
      name: "Business Analytics Platform",
      category: "Analytics & Reporting",
      description: "Advanced analytics and visualization platform with real-time dashboards, custom reports, and predictive insights",
      keyFeatures: [
        "Real-time dashboards",
        "Predictive analytics",
        "Custom report builder",
        "Data visualization tools",
        "Automated insights",
        "Multi-source data integration"
      ],
      useCases: [
        "Executive reporting and KPI tracking",
        "Sales performance analysis",
        "Customer behavior analytics"
      ],
      targetIndustries: ["Retail", "E-commerce", "Finance", "SaaS"],
      pricingModel: "Tiered by data volume",
      typicalPrice: "$199-499/month",
      implementationTime: "3-6 weeks",
      integratesWith: ["CRM-PRO", "API-PLATFORM"],
      isActive: true,
    },
    {
      code: "AUTOMATION-SUITE",
      name: "Workflow Automation Suite",
      category: "Process Automation",
      description: "No-code workflow automation platform for streamlining business processes and eliminating manual tasks",
      keyFeatures: [
        "Visual workflow designer",
        "Pre-built templates",
        "Multi-step automation",
        "Conditional logic",
        "Scheduled workflows",
        "Error handling and notifications"
      ],
      useCases: [
        "Sales follow-up automation",
        "Lead routing and assignment",
        "Customer onboarding workflows",
        "Data synchronization"
      ],
      targetIndustries: ["All industries"],
      pricingModel: "Tiered by workflow executions",
      typicalPrice: "$99-299/month",
      implementationTime: "1-2 weeks",
      integratesWith: ["CRM-PRO", "EMAIL-SYNC", "API-PLATFORM"],
      isActive: true,
    },
  ];

  const sampleCaseStudies = [
    {
      title: "TechCorp Increases Sales Velocity by 40% with CRM Implementation",
      industry: "Technology",
      productCodes: ["CRM-PRO"],
      problemStatement: "TechCorp, a B2B SaaS company with 50 sales reps, was struggling with inconsistent sales processes, lost leads, and lack of pipeline visibility. Sales reps were using spreadsheets and email, leading to duplicated efforts and missed opportunities.",
      solution: "Implemented Professional CRM Suite with custom sales stages, automated lead routing, and integrated email tracking. Created standardized workflows for opportunity management and forecasting.",
      implementation: "Phase 1 (Week 1-2): Data migration from spreadsheets, CRM configuration, and custom fields setup. Phase 2 (Week 3-4): Sales team training and workflow automation implementation. Phase 3 (Week 5-6): Go-live with full support and optimization.",
      outcomes: [
        { metric: "Sales cycle length", value: "Reduced by 35% (from 60 to 39 days)" },
        { metric: "Win rate", value: "Increased from 18% to 27%" },
        { metric: "Pipeline visibility", value: "100% of deals tracked in real-time" },
        { metric: "Sales velocity", value: "Improved by 40%" },
        { metric: "Lead response time", value: "Reduced from 4 hours to 15 minutes" }
      ],
      customerSize: "Mid-Market (50-200 employees)",
      timeToValue: "6 weeks",
      tags: ["CRM", "sales", "B2B", "pipeline management"],
      isActive: true,
    },
    {
      title: "RetailMax Boosts Revenue 28% Through Data-Driven Decision Making",
      industry: "Retail",
      productCodes: ["ANALYTICS-PRO"],
      problemStatement: "RetailMax, a regional retail chain with 30 locations, lacked visibility into sales trends, inventory performance, and customer behavior. Decisions were made based on gut feel rather than data, leading to stockouts and missed opportunities.",
      solution: "Deployed Business Analytics Platform with real-time dashboards for each store, predictive analytics for inventory management, and customer segmentation for targeted marketing.",
      implementation: "Integrated point-of-sale data, historical sales records, and customer data into the analytics platform. Built custom dashboards for store managers and executive team. Trained staff on data interpretation and decision-making.",
      outcomes: [
        { metric: "Revenue growth", value: "Increased by 28% year-over-year" },
        { metric: "Inventory turnover", value: "Improved by 45%" },
        { metric: "Stockouts", value: "Reduced by 60%" },
        { metric: "Customer retention", value: "Increased from 45% to 62%" },
        { metric: "Marketing ROI", value: "Improved by 3.2x" }
      ],
      customerSize: "Mid-Market (200-500 employees)",
      timeToValue: "8 weeks",
      tags: ["analytics", "retail", "data-driven", "inventory"],
      isActive: true,
    },
    {
      title: "ServicePro Saves 25 Hours/Week with Workflow Automation",
      industry: "Professional Services",
      productCodes: ["AUTOMATION-SUITE", "CRM-PRO"],
      problemStatement: "ServicePro, a consulting firm with 35 consultants, spent excessive time on manual administrative tasks including client onboarding, project setup, invoice generation, and follow-ups. This reduced billable hours and slowed client response times.",
      solution: "Implemented Workflow Automation Suite integrated with CRM to automate client onboarding, project kickoff workflows, invoice generation, and follow-up sequences. Created templates for common processes.",
      implementation: "Mapped existing manual processes, designed automated workflows, configured triggers and conditions, and integrated with existing tools (CRM, accounting software, email). Rolled out in phases with team training.",
      outcomes: [
        { metric: "Administrative time saved", value: "25 hours per week" },
        { metric: "Client onboarding time", value: "Reduced from 3 days to 4 hours" },
        { metric: "Billable hours increase", value: "18% improvement" },
        { metric: "Client satisfaction", value: "Improved from 7.2 to 9.1/10" },
        { metric: "Error rate in invoicing", value: "Reduced by 85%" }
      ],
      customerSize: "SMB (20-50 employees)",
      timeToValue: "3 weeks",
      tags: ["automation", "professional services", "efficiency", "onboarding"],
      isActive: true,
    },
  ];

  const samplePlaybooks = [
    {
      title: "CRM Implementation for B2B Sales Teams",
      productCodes: ["CRM-PRO"],
      scenario: "Company with 10+ sales reps struggling with pipeline visibility and inconsistent sales processes",
      steps: [
        {
          step: 1,
          title: "Discovery & Requirements Gathering",
          description: "Meet with sales leadership and reps to understand current process, pain points, and success criteria. Document sales stages, deal types, and required custom fields.",
          duration: "3-5 days"
        },
        {
          step: 2,
          title: "Data Migration & CRM Configuration",
          description: "Export existing data from spreadsheets/old system. Clean and standardize data. Configure CRM with custom sales stages, fields, and workflows. Import data and validate accuracy.",
          duration: "1 week"
        },
        {
          step: 3,
          title: "Workflow Automation Setup",
          description: "Configure lead routing rules, email templates, automated follow-ups, and notifications. Set up sales stage automation and opportunity scoring.",
          duration: "3-5 days"
        },
        {
          step: 4,
          title: "Team Training & Adoption",
          description: "Conduct hands-on training sessions for sales reps and managers. Create documentation and quick-reference guides. Assign champions to drive adoption.",
          duration: "1 week"
        },
        {
          step: 5,
          title: "Go-Live & Optimization",
          description: "Launch CRM with full team. Monitor usage and gather feedback. Make adjustments based on real-world usage. Celebrate wins and address concerns.",
          duration: "2 weeks"
        }
      ],
      prerequisites: [
        "Executive buy-in and sponsorship",
        "Identified CRM champion/administrator",
        "Clean data export from existing systems",
        "Defined sales process and stages"
      ],
      commonChallenges: [
        {
          challenge: "Low user adoption",
          solution: "Make CRM usage mandatory for deal tracking, tie to compensation, provide ongoing training, showcase success stories"
        },
        {
          challenge: "Data quality issues",
          solution: "Implement validation rules, set up duplicate detection, assign data stewards, regular cleanup audits"
        }
      ],
      successMetrics: [
        "90%+ daily active users within 30 days",
        "100% of opportunities tracked in CRM",
        "Improved forecast accuracy",
        "Reduced sales cycle length"
      ],
      tags: ["CRM", "implementation", "sales", "change management"],
      isActive: true,
    },
    {
      title: "Analytics Platform Deployment & Training",
      productCodes: ["ANALYTICS-PRO"],
      scenario: "Organization needs data-driven decision making capabilities and real-time visibility into key metrics",
      steps: [
        {
          step: 1,
          title: "Data Source Integration",
          description: "Identify all data sources (CRM, ERP, databases, spreadsheets). Set up connectors and data pipelines. Validate data flow and accuracy.",
          duration: "1 week"
        },
        {
          step: 2,
          title: "Dashboard Design & Development",
          description: "Work with stakeholders to define KPIs and metrics. Design dashboard layouts. Build visualizations and reports. Test with sample data.",
          duration: "1-2 weeks"
        },
        {
          step: 3,
          title: "User Access & Permissions",
          description: "Set up user roles and permissions. Configure row-level security if needed. Create user accounts and assign to appropriate groups.",
          duration: "2-3 days"
        },
        {
          step: 4,
          title: "Training & Documentation",
          description: "Train power users on dashboard creation. Train end users on navigation and interpretation. Create user guides and video tutorials.",
          duration: "1 week"
        },
        {
          step: 5,
          title: "Rollout & Support",
          description: "Phase rollout to different teams/departments. Provide helpdesk support. Gather feedback and iterate on dashboards.",
          duration: "Ongoing"
        }
      ],
      prerequisites: [
        "Access to all required data sources",
        "Defined KPIs and success metrics",
        "Stakeholder alignment on dashboard requirements"
      ],
      commonChallenges: [
        {
          challenge: "Data silos and integration complexity",
          solution: "Start with most critical data sources, use APIs where available, plan for gradual integration"
        },
        {
          challenge: "Users don't trust the data",
          solution: "Implement data validation checks, provide data lineage visibility, conduct regular audits"
        }
      ],
      successMetrics: [
        "Real-time dashboards accessible to all stakeholders",
        "Data-driven decisions replace gut feel",
        "Faster response to market changes",
        "Improved forecast accuracy"
      ],
      tags: ["analytics", "implementation", "data integration", "training"],
      isActive: true,
    },
  ];

  try {
    console.log("Inserting products...");
    for (const product of sampleProducts) {
      await db.insert(products).values(product).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${sampleProducts.length} products`);

    console.log("Inserting case studies...");
    for (const caseStudy of sampleCaseStudies) {
      await db.insert(caseStudies).values(caseStudy).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${sampleCaseStudies.length} case studies`);

    console.log("Inserting implementation playbooks...");
    for (const playbook of samplePlaybooks) {
      await db.insert(implementationPlaybooks).values(playbook).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${samplePlaybooks.length} playbooks`);

    console.log("🎉 Knowledge base seeded successfully!");
  } catch (error) {
    console.error("Error seeding knowledge base:", error);
    throw error;
  }
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
