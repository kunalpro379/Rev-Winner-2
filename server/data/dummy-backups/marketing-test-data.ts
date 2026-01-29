export interface DummyBackupData {
  conversationId: string;
  userId: string;
  clientName: string;
  companyName: string;
  industry: string;
  meetingDate: Date;
  meetingDurationMinutes: number;
  executiveSummary: string;
  keyTopicsDiscussed: string[];
  clientPainPoints: string[];
  clientRequirements: string[];
  solutionsProposed: string[];
  competitorsDiscussed: string[];
  objections: { objection: string; response: string; outcome: string }[];
  actionItems: string[];
  nextSteps: string[];
  fullTranscript: string;
  messageCount: number;
  keyQuotes: string[];
  marketingHooks: string[];
  bestPractices: string[];
  statisticalData: {
    dealSize: number;
    winProbability: number;
    salesCycleStage: string;
    engagementScore: number;
    sentimentScore: number;
    competitiveRisk: number;
  };
  featuresLiked: string[];
  featuresDisliked: string[];
  appreciatedAspects: string[];
}

export const dummyMarketingBackups: DummyBackupData[] = [
  {
    conversationId: "conv-001-microsoft",
    userId: "user-microsoft-001",
    clientName: "Sarah Chen",
    companyName: "Microsoft",
    industry: "Technology",
    meetingDate: new Date("2025-12-10T10:00:00Z"),
    meetingDurationMinutes: 45,
    executiveSummary: "Productive discovery call with Microsoft's enterprise procurement team. Strong interest in AI-powered sales intelligence for their global sales organization of 15,000+ reps. Key concern around data security and integration with existing CRM.",
    keyTopicsDiscussed: [
      "Global sales enablement challenges",
      "Integration with Dynamics 365",
      "AI accuracy and training requirements",
      "Data privacy and sovereignty",
      "Multi-language support"
    ],
    clientPainPoints: [
      "Sales reps spend 40% of time on administrative tasks instead of selling",
      "Inconsistent messaging across global teams",
      "Delayed insights from quarterly reviews vs real-time feedback",
      "High onboarding time for new sales hires (6+ months to productivity)",
      "Lack of visibility into conversation quality metrics"
    ],
    clientRequirements: [
      "SOC 2 Type II compliance required",
      "Integration with Dynamics 365 CRM",
      "Support for 12+ languages",
      "GDPR compliance for EU operations",
      "On-premise deployment option for sensitive data"
    ],
    solutionsProposed: [
      "Rev Winner Enterprise with dedicated infrastructure",
      "Custom Dynamics 365 connector",
      "Multi-language AI model training",
      "Private cloud deployment option"
    ],
    competitorsDiscussed: ["Gong", "Chorus.ai", "Clari"],
    objections: [
      {
        objection: "How does your AI accuracy compare to Gong's established platform?",
        response: "Our AI achieves 94% accuracy on sales intent detection, and unlike competitors, we offer domain-specific training that improves accuracy by 15-20% for enterprise customers.",
        outcome: "Client expressed interest in a proof of concept to validate claims"
      },
      {
        objection: "What's the total cost of ownership including implementation?",
        response: "Our enterprise pricing includes dedicated implementation support, training, and ongoing success management. Most customers see positive ROI within 4 months.",
        outcome: "Requested detailed pricing proposal"
      }
    ],
    actionItems: [
      "Send SOC 2 Type II certification documents",
      "Prepare Dynamics 365 integration demo",
      "Schedule technical deep-dive with IT security team",
      "Provide customer references in enterprise software"
    ],
    nextSteps: [
      "Technical security review scheduled for next week",
      "Follow-up call with procurement in 10 days",
      "Prepare pilot proposal for 500-user deployment"
    ],
    fullTranscript: `Sarah: Thank you for taking the time today. We've been evaluating several sales intelligence platforms for our global sales team.

Sales Rep: Absolutely, Sarah. I'm excited to learn more about Microsoft's needs. Can you tell me about the current challenges your sales organization is facing?

Sarah: Our biggest issue is that our 15,000+ sales reps spend about 40% of their time on administrative tasks instead of actually selling. Things like updating CRM, writing call summaries, and preparing for meetings.

Sales Rep: That's a significant time drain. What impact does that have on your revenue targets?

Sarah: It's substantial. We estimate we're leaving about $200 million on the table annually just from lost selling time. Plus, our new hires take 6+ months to become productive because there's so much tribal knowledge they need to absorb.

Sales Rep: Rev Winner can help with both of those challenges. Our AI automatically generates meeting summaries, updates your CRM, and provides real-time coaching to new reps. How important is integration with your existing tools?

Sarah: Critical. We're heavily invested in Dynamics 365, so any solution needs to work seamlessly with that. And security is non-negotiable - we need SOC 2 Type II compliance at minimum.

Sales Rep: We have SOC 2 Type II certification and can provide custom Dynamics 365 integration. Can you tell me about your current tools and what's not working?

Sarah: We've evaluated Gong and Chorus.ai. Gong has good transcription but their coaching features are limited. We need something that can actually improve sales performance, not just record conversations.

Sales Rep: That's exactly our differentiator. Our domain expertise training means the AI understands your specific industry context, improving accuracy by 15-20% compared to generic solutions.

Sarah: That's impressive. What's the implementation timeline look like?

Sales Rep: For an enterprise deployment of your scale, we typically see 90 days to full rollout with dedicated implementation support. We'd start with a 500-user pilot.

Sarah: I'd like to see a technical deep-dive with our IT security team. Can you set that up?

Sales Rep: Absolutely. I'll send over our security documentation and we'll schedule that review for next week.`,
    messageCount: 127,
    keyQuotes: [
      "Our sales reps are drowning in admin work - if we could get even 10% of that time back, it would be transformational",
      "The real-time coaching aspect is what sets this apart from our current tools",
      "I'm impressed by the domain expertise training - that's something our current vendor can't do"
    ],
    marketingHooks: [
      "Transform 40% admin time into active selling time",
      "Real-time coaching for 15,000+ global sales reps",
      "Enterprise-grade security with SOC 2 Type II compliance"
    ],
    bestPractices: [
      "Lead with security certifications for enterprise prospects",
      "Demonstrate ROI calculations early in the conversation",
      "Emphasize domain-specific training advantages over competitors"
    ],
    statisticalData: {
      dealSize: 2500000,
      winProbability: 65,
      salesCycleStage: "Evaluation",
      engagementScore: 85,
      sentimentScore: 78,
      competitiveRisk: 45
    },
    featuresLiked: [
      "Real-time conversation analysis",
      "Domain expertise training",
      "Multi-language support",
      "Custom CRM integration",
      "Security compliance features"
    ],
    featuresDisliked: [
      "No native Dynamics 365 connector (requires custom integration)",
      "Limited offline capabilities",
      "Mobile app still in beta"
    ],
    appreciatedAspects: [
      "Transparent pricing model",
      "Dedicated implementation support",
      "Responsive pre-sales team",
      "Clear security documentation"
    ]
  },
  {
    conversationId: "conv-002-microsoft",
    userId: "user-microsoft-002",
    clientName: "James Rodriguez",
    companyName: "Microsoft",
    industry: "Technology",
    meetingDate: new Date("2025-12-12T14:00:00Z"),
    meetingDurationMinutes: 60,
    executiveSummary: "Deep-dive technical session with Microsoft Azure team exploring cloud infrastructure requirements. Strong alignment on scalability needs and API architecture.",
    keyTopicsDiscussed: [
      "Azure integration requirements",
      "API rate limits and scalability",
      "Data residency requirements",
      "SSO integration with Azure AD",
      "Performance benchmarks"
    ],
    clientPainPoints: [
      "Current tools don't scale well beyond 10,000 concurrent users",
      "API limitations causing bottlenecks during peak usage",
      "Complex authentication requirements for enterprise SSO",
      "Need for regional data processing to meet compliance"
    ],
    clientRequirements: [
      "Azure AD SSO integration required",
      "Support for 50,000+ concurrent users",
      "API SLA of 99.95% uptime",
      "Data processing in specific Azure regions"
    ],
    solutionsProposed: [
      "Dedicated Azure infrastructure deployment",
      "High-availability API cluster with auto-scaling",
      "Azure AD native integration",
      "Multi-region deployment architecture"
    ],
    competitorsDiscussed: ["Gong", "SalesLoft", "Outreach"],
    objections: [
      {
        objection: "Can your infrastructure really handle our scale?",
        response: "We currently process 2M+ conversations daily for enterprise clients. Our Azure-native architecture auto-scales to handle peak loads.",
        outcome: "Agreed to run a load testing pilot"
      }
    ],
    actionItems: [
      "Provide Azure architecture documentation",
      "Schedule load testing session",
      "Share API performance benchmarks"
    ],
    nextSteps: [
      "Technical architecture review with Azure team",
      "Load testing pilot in Q1"
    ],
    fullTranscript: `James: Let's dive into the technical requirements we discussed. I'm from the Azure infrastructure team and I need to understand your scalability story.

Sales Rep: Absolutely, James. What's your current scale and where do you need to be?

James: We have 50,000 sales reps globally. During peak periods like quarter-end, we can have 10,000+ concurrent users. Our current tools start degrading at around 5,000.

Sales Rep: That's a common challenge. Rev Winner's architecture is built on Azure-native services with auto-scaling. We currently process over 2 million conversations daily for our enterprise clients.

James: What's your uptime SLA? We require 99.95% minimum for business-critical systems.

Sales Rep: We guarantee 99.95% uptime with our enterprise tier. We also offer multi-region deployment so data stays within specific Azure regions for compliance.

James: That's important - we have strict data residency requirements for EMEA. How does your SSO integration work with Azure AD?

Sales Rep: We have native Azure AD integration. Your users authenticate through your existing Azure AD tenant - no separate credentials needed. We support SAML 2.0 and OIDC.

James: I'd want to run a load test before we commit. Can you support that?

Sales Rep: Definitely. We typically do a 2-week pilot where we simulate your peak loads. We'll provide detailed performance metrics and can run the test in an isolated environment.

James: The Azure-native approach is exactly what we need for our hybrid cloud strategy. Let me schedule a follow-up with our Azure architecture team.

Sales Rep: Perfect. I'll send over our architecture documentation and API specs. We can also arrange a session with our solutions architects.`,
    messageCount: 189,
    keyQuotes: [
      "If you can prove the scalability, we're very interested in moving forward",
      "The Azure-native approach is exactly what we need for our hybrid cloud strategy"
    ],
    marketingHooks: [
      "Enterprise-scale: 50,000+ concurrent users supported",
      "Azure-native architecture for seamless integration",
      "99.95% API uptime SLA"
    ],
    bestPractices: [
      "Lead technical conversations with architecture diagrams",
      "Prepare benchmark data for scalability discussions",
      "Offer load testing as proof point"
    ],
    statisticalData: {
      dealSize: 3200000,
      winProbability: 70,
      salesCycleStage: "Technical Validation",
      engagementScore: 92,
      sentimentScore: 82,
      competitiveRisk: 35
    },
    featuresLiked: [
      "Azure-native architecture",
      "Auto-scaling capabilities",
      "Enterprise SSO integration",
      "High-availability design"
    ],
    featuresDisliked: [
      "Setup complexity for multi-region deployment",
      "Documentation could be more detailed"
    ],
    appreciatedAspects: [
      "Technical team expertise",
      "Willingness to do custom integration work",
      "Transparent about current limitations"
    ]
  },
  {
    conversationId: "conv-003-salesforce",
    userId: "user-salesforce-001",
    clientName: "Maria Santos",
    companyName: "Salesforce",
    industry: "Technology",
    meetingDate: new Date("2025-12-08T09:00:00Z"),
    meetingDurationMinutes: 50,
    executiveSummary: "Strategic discussion with Salesforce's revenue operations team about enhancing their sales coaching program. Strong interest in AI-driven insights but concerns about internal buy-in.",
    keyTopicsDiscussed: [
      "Sales coaching methodology integration",
      "Salesforce CRM native integration",
      "Change management for 8,000 reps",
      "Measuring coaching effectiveness",
      "Executive dashboard requirements"
    ],
    clientPainPoints: [
      "Current coaching is inconsistent across regions",
      "No objective metrics for coaching quality",
      "Managers spend too much time on call reviews",
      "New hire ramp time is 9+ months",
      "Top performer behaviors not systematically captured"
    ],
    clientRequirements: [
      "Native Salesforce integration",
      "Executive-level reporting dashboards",
      "Coaching playbook customization",
      "Integration with existing LMS"
    ],
    solutionsProposed: [
      "Rev Winner Sales Coaching module",
      "Native Salesforce AppExchange integration",
      "Custom coaching scorecards",
      "AI-powered ramp time acceleration"
    ],
    competitorsDiscussed: ["Gong", "Mindtickle", "Lessonly"],
    objections: [
      {
        objection: "Our managers are resistant to AI-based coaching recommendations",
        response: "We position AI as a coaching assistant, not replacement. Our platform surfaces insights while managers retain full control of coaching decisions.",
        outcome: "Interest in change management workshop"
      },
      {
        objection: "We've invested heavily in our internal coaching tools",
        response: "Rev Winner complements existing investments - we integrate with your LMS and coaching workflows rather than replacing them.",
        outcome: "Agreed to integration assessment"
      }
    ],
    actionItems: [
      "Demo native Salesforce integration",
      "Prepare change management playbook",
      "Share case study from similar enterprise deployment"
    ],
    nextSteps: [
      "Change management workshop next month",
      "Technical integration assessment",
      "Pilot proposal for APAC region"
    ],
    fullTranscript: "Maria: Thanks for accommodating our schedule. We're really looking for a solution that works with our existing Salesforce investment...",
    messageCount: 156,
    keyQuotes: [
      "Reducing ramp time from 9 months to 6 would save us millions in lost productivity",
      "The native Salesforce integration is a must-have for us",
      "We need to prove this to our leadership team with hard metrics"
    ],
    marketingHooks: [
      "Reduce sales ramp time by 33%",
      "Native Salesforce AppExchange integration",
      "AI-assisted coaching that empowers managers"
    ],
    bestPractices: [
      "Address change management concerns proactively",
      "Position AI as assistant to human managers",
      "Emphasize integration over replacement"
    ],
    statisticalData: {
      dealSize: 1800000,
      winProbability: 55,
      salesCycleStage: "Discovery",
      engagementScore: 75,
      sentimentScore: 70,
      competitiveRisk: 50
    },
    featuresLiked: [
      "Native Salesforce integration",
      "Coaching scorecards",
      "Executive dashboards",
      "AI-assisted insights"
    ],
    featuresDisliked: [
      "Learning curve for managers",
      "Initial setup complexity",
      "Limited LMS integrations currently"
    ],
    appreciatedAspects: [
      "Understanding of change management challenges",
      "Flexible deployment options",
      "Strong customer success resources"
    ]
  },
  {
    conversationId: "conv-004-jpmorgan",
    userId: "user-jpmorgan-001",
    clientName: "Robert Kim",
    companyName: "JP Morgan",
    industry: "Financial Services",
    meetingDate: new Date("2025-12-05T11:00:00Z"),
    meetingDurationMinutes: 55,
    executiveSummary: "Initial discovery with JP Morgan's wealth management division. Stringent security requirements but strong interest in AI-powered client engagement insights.",
    keyTopicsDiscussed: [
      "Client engagement optimization",
      "Regulatory compliance (SEC, FINRA)",
      "Data security and encryption",
      "Wealth advisor productivity",
      "Client sentiment analysis"
    ],
    clientPainPoints: [
      "Wealth advisors missing cross-sell opportunities",
      "Inconsistent client experience across advisors",
      "Manual compliance review of client communications",
      "Limited visibility into client satisfaction",
      "High-value client churn increasing"
    ],
    clientRequirements: [
      "SEC and FINRA compliance",
      "End-to-end encryption for all data",
      "Audit trail for all interactions",
      "Integration with existing CRM and compliance systems",
      "Air-gapped deployment option"
    ],
    solutionsProposed: [
      "Rev Winner Financial Services edition",
      "Compliance-ready conversation intelligence",
      "Secure private cloud deployment",
      "Real-time sentiment analysis"
    ],
    competitorsDiscussed: ["Gong", "Relativity", "Verint"],
    objections: [
      {
        objection: "How do you handle the regulatory complexity of financial services?",
        response: "Our platform is built with financial services compliance in mind. We have dedicated compliance modules for SEC, FINRA, and MiFID II requirements, with automatic redaction and archiving.",
        outcome: "Requested compliance documentation review"
      },
      {
        objection: "Our data can never leave our infrastructure",
        response: "We offer fully air-gapped deployment options with all processing done within your infrastructure. Our enterprise security team can work with your IT to design the right architecture.",
        outcome: "Scheduled security architecture review"
      }
    ],
    actionItems: [
      "Provide SEC/FINRA compliance documentation",
      "Schedule security architecture review",
      "Share financial services customer references"
    ],
    nextSteps: [
      "Compliance team review in two weeks",
      "Security architecture workshop",
      "Reference calls with similar financial institutions"
    ],
    fullTranscript: "Robert: Thank you for coming to our offices. Security and compliance are our top priorities...",
    messageCount: 134,
    keyQuotes: [
      "If we can prove this reduces compliance review time, the ROI case writes itself",
      "Our wealth advisors need to focus on clients, not paperwork",
      "We've lost several high-value clients because we weren't proactive enough"
    ],
    marketingHooks: [
      "SEC and FINRA compliant from day one",
      "Air-gapped deployment for maximum security",
      "Reduce compliance review time by 60%"
    ],
    bestPractices: [
      "Lead with compliance and security for financial services",
      "Offer on-premise/air-gapped options upfront",
      "Reference similar regulated industry deployments"
    ],
    statisticalData: {
      dealSize: 4500000,
      winProbability: 45,
      salesCycleStage: "Discovery",
      engagementScore: 68,
      sentimentScore: 72,
      competitiveRisk: 55
    },
    featuresLiked: [
      "Compliance-ready architecture",
      "Air-gapped deployment option",
      "Audit trail capabilities",
      "Sentiment analysis"
    ],
    featuresDisliked: [
      "Limited financial services-specific templates",
      "No existing FINRA integration",
      "Setup complexity for air-gapped deployment"
    ],
    appreciatedAspects: [
      "Understanding of regulatory requirements",
      "Flexibility on deployment options",
      "Security-first approach"
    ]
  },
  {
    conversationId: "conv-005-pfizer",
    userId: "user-pfizer-001",
    clientName: "Dr. Amanda Collins",
    companyName: "Pfizer",
    industry: "Healthcare & Pharmaceuticals",
    meetingDate: new Date("2025-12-03T15:00:00Z"),
    meetingDurationMinutes: 40,
    executiveSummary: "Discussion with Pfizer's commercial operations team about improving HCP (Healthcare Professional) engagement. Focus on compliance with pharma regulations while improving rep effectiveness.",
    keyTopicsDiscussed: [
      "HCP engagement optimization",
      "FDA compliance for promotional content",
      "Medical legal regulatory review",
      "Rep training and coaching",
      "Omnichannel engagement tracking"
    ],
    clientPainPoints: [
      "HCPs have limited time for sales interactions",
      "Compliance review slows content updates",
      "Reps struggle with complex scientific messaging",
      "Limited insights into HCP preferences",
      "Inconsistent messaging across channels"
    ],
    clientRequirements: [
      "FDA promotional guideline compliance",
      "Medical legal regulatory (MLR) workflow integration",
      "HIPAA compliance",
      "Integration with Veeva CRM",
      "Scientific accuracy validation"
    ],
    solutionsProposed: [
      "Rev Winner Pharma edition",
      "Pre-approved messaging templates",
      "AI-powered scientific accuracy checks",
      "Veeva CRM integration"
    ],
    competitorsDiscussed: ["Veeva Engage", "IQVIA", "Aktana"],
    objections: [
      {
        objection: "How do you ensure scientific accuracy in AI recommendations?",
        response: "Our pharma-specific AI is trained on approved messaging only. All suggestions go through your MLR workflow before deployment.",
        outcome: "Interest in seeing the MLR integration demo"
      }
    ],
    actionItems: [
      "Demo Veeva CRM integration",
      "Provide FDA compliance documentation",
      "Share pharma customer case studies"
    ],
    nextSteps: [
      "MLR team demonstration next week",
      "Compliance documentation review",
      "Pilot proposal for oncology business unit"
    ],
    fullTranscript: "Dr. Collins: Our field reps are highly trained, but we're looking for ways to help them be more effective in their limited HCP interactions...",
    messageCount: 98,
    keyQuotes: [
      "Every minute with an HCP is precious - we need to maximize the impact of each interaction",
      "If you can integrate with our MLR workflow, that would be a game-changer",
      "The scientific accuracy aspect is critical - we can't have any off-label messaging"
    ],
    marketingHooks: [
      "FDA-compliant conversation intelligence for pharma",
      "Seamless Veeva CRM integration",
      "Maximize HCP engagement with AI-powered insights"
    ],
    bestPractices: [
      "Emphasize compliance and scientific accuracy for pharma",
      "Lead with Veeva integration capabilities",
      "Offer MLR workflow integration as differentiator"
    ],
    statisticalData: {
      dealSize: 2800000,
      winProbability: 50,
      salesCycleStage: "Discovery",
      engagementScore: 72,
      sentimentScore: 75,
      competitiveRisk: 60
    },
    featuresLiked: [
      "Scientific accuracy validation",
      "Veeva CRM integration",
      "Pre-approved messaging templates",
      "Compliance workflow integration"
    ],
    featuresDisliked: [
      "No existing MLR workflow integration",
      "Limited oncology-specific training",
      "Setup complexity"
    ],
    appreciatedAspects: [
      "Understanding of pharma regulatory landscape",
      "Scientific accuracy focus",
      "Flexible integration approach"
    ]
  },
  {
    conversationId: "conv-006-amazon",
    userId: "user-amazon-001",
    clientName: "Jennifer Wright",
    companyName: "Amazon",
    industry: "E-commerce & Cloud",
    meetingDate: new Date("2025-12-15T16:00:00Z"),
    meetingDurationMinutes: 65,
    executiveSummary: "Strategic discussion with Amazon AWS enterprise sales leadership about deploying conversation intelligence across their B2B sales teams. High interest in scale and AWS integration.",
    keyTopicsDiscussed: [
      "AWS integration opportunities",
      "Global sales team deployment",
      "Real-time coaching at scale",
      "Data sovereignty across regions",
      "Competitive win/loss analysis"
    ],
    clientPainPoints: [
      "Sales cycles becoming longer and more complex",
      "Difficulty tracking competitive dynamics in real-time",
      "Inconsistent discovery processes across teams",
      "Limited visibility into deal progression signals",
      "New product launch messaging inconsistency"
    ],
    clientRequirements: [
      "Native AWS infrastructure deployment",
      "Support for 25,000+ sales reps globally",
      "Real-time competitive intelligence",
      "Integration with internal tools and Salesforce",
      "Multi-region data processing"
    ],
    solutionsProposed: [
      "Rev Winner Enterprise on AWS",
      "Global multi-region deployment",
      "Real-time competitive intelligence module",
      "Custom Salesforce and internal tool integrations"
    ],
    competitorsDiscussed: ["Gong", "Clari", "People.ai"],
    objections: [
      {
        objection: "We already have significant investments in internal tools",
        response: "Rev Winner is designed to complement, not replace. We've successfully integrated with custom internal tools at other hyperscalers.",
        outcome: "Interested in integration architecture session"
      },
      {
        objection: "How do you handle our scale of 25,000+ reps?",
        response: "We've architected for hyperscale from day one. Our largest customer processes 3M+ conversations monthly without performance degradation.",
        outcome: "Requested case study from similar scale deployment"
      }
    ],
    actionItems: [
      "Prepare AWS-native architecture proposal",
      "Share hyperscale customer case study",
      "Schedule integration architecture workshop"
    ],
    nextSteps: [
      "Technical architecture workshop next month",
      "Pilot proposal for AWS enterprise sales team",
      "Executive sponsor meeting"
    ],
    fullTranscript: "Jennifer: Thanks for making time. We're looking at how to better enable our sales teams as we continue to scale...",
    messageCount: 203,
    keyQuotes: [
      "Scale is non-negotiable - if you can't handle 25,000 reps, we can't consider you",
      "Real-time competitive intelligence is increasingly critical for our enterprise deals",
      "We need something that works with our existing investments, not replaces them"
    ],
    marketingHooks: [
      "Hyperscale-ready: 25,000+ reps supported",
      "AWS-native deployment for maximum performance",
      "Real-time competitive intelligence for enterprise deals"
    ],
    bestPractices: [
      "Lead with scale capabilities for large enterprises",
      "Emphasize complementary rather than replacement approach",
      "Prepare detailed architecture for hyperscale requirements"
    ],
    statisticalData: {
      dealSize: 5500000,
      winProbability: 40,
      salesCycleStage: "Discovery",
      engagementScore: 80,
      sentimentScore: 75,
      competitiveRisk: 65
    },
    featuresLiked: [
      "AWS-native architecture",
      "Hyperscale support",
      "Real-time competitive intelligence",
      "Integration flexibility"
    ],
    featuresDisliked: [
      "Unproven at their specific scale",
      "Limited internal tool integrations",
      "Competitive intelligence module still maturing"
    ],
    appreciatedAspects: [
      "Honest about current capabilities",
      "Willingness to do custom work",
      "Technical expertise of team"
    ]
  },
  {
    conversationId: "conv-007-uber",
    userId: "user-uber-001",
    clientName: "Michael Thompson",
    companyName: "Uber",
    industry: "Transportation & Technology",
    meetingDate: new Date("2025-12-18T13:00:00Z"),
    meetingDurationMinutes: 45,
    executiveSummary: "Discovery call with Uber's B2B sales team focused on Uber for Business and Uber Freight sales optimization. Interest in reducing sales cycle time and improving win rates.",
    keyTopicsDiscussed: [
      "B2B sales cycle optimization",
      "Freight sales enablement",
      "Enterprise deal tracking",
      "Competitive positioning against Lyft Business",
      "Multi-product sales coordination"
    ],
    clientPainPoints: [
      "Long enterprise sales cycles (6-9 months)",
      "Complex multi-product deals hard to track",
      "Inconsistent messaging across Uber for Business and Freight",
      "Limited visibility into deal health",
      "Competitive pressure from Lyft Business"
    ],
    clientRequirements: [
      "Integration with Salesforce",
      "Multi-product deal tracking",
      "Competitive intelligence dashboard",
      "Mobile-first experience for field reps",
      "Real-time deal health scoring"
    ],
    solutionsProposed: [
      "Rev Winner Pro with competitive intelligence",
      "Custom multi-product deal tracking",
      "Mobile-optimized coaching",
      "Real-time deal health analytics"
    ],
    competitorsDiscussed: ["Gong", "Chorus.ai", "SalesLoft"],
    objections: [
      {
        objection: "Our field reps are always on the go - desktop solutions don't work for us",
        response: "Our mobile experience is designed for field sales. Reps can access coaching, competitive intel, and deal insights right from their phones.",
        outcome: "Requested mobile app demo"
      }
    ],
    actionItems: [
      "Schedule mobile app demonstration",
      "Prepare multi-product deal tracking demo",
      "Share transportation industry case studies"
    ],
    nextSteps: [
      "Mobile app demo next week",
      "Pilot proposal for Uber Freight team",
      "Competitive intelligence workshop"
    ],
    fullTranscript: "Michael: Our B2B sales teams are growing fast and we need better tools to help them win more deals...",
    messageCount: 112,
    keyQuotes: [
      "Shortening our sales cycle from 9 months to 6 would be a massive win",
      "Mobile-first is essential - our reps are never at their desks",
      "The multi-product tracking is really interesting for our complex deals"
    ],
    marketingHooks: [
      "Reduce enterprise sales cycles by 30%",
      "Mobile-first sales enablement for field teams",
      "Multi-product deal intelligence"
    ],
    bestPractices: [
      "Lead with mobile capabilities for field sales teams",
      "Emphasize sales cycle reduction ROI",
      "Demonstrate multi-product deal tracking"
    ],
    statisticalData: {
      dealSize: 950000,
      winProbability: 60,
      salesCycleStage: "Discovery",
      engagementScore: 78,
      sentimentScore: 80,
      competitiveRisk: 40
    },
    featuresLiked: [
      "Mobile-first design",
      "Multi-product deal tracking",
      "Competitive intelligence",
      "Sales cycle analytics"
    ],
    featuresDisliked: [
      "Limited offline mobile capabilities",
      "No native Uber systems integration",
      "Learning curve for new features"
    ],
    appreciatedAspects: [
      "Understanding of field sales challenges",
      "Focus on practical ROI",
      "Responsive demo scheduling"
    ]
  },
  {
    conversationId: "conv-008-dell",
    userId: "user-dell-001",
    clientName: "Patricia Lee",
    companyName: "Dell Technologies",
    industry: "Technology Hardware",
    meetingDate: new Date("2025-12-01T10:00:00Z"),
    meetingDurationMinutes: 50,
    executiveSummary: "Strategic conversation with Dell's channel sales leadership about improving partner sales enablement. Focus on empowering 50,000+ channel partners with AI-driven insights.",
    keyTopicsDiscussed: [
      "Channel partner enablement",
      "Partner training and certification",
      "Deal registration tracking",
      "Competitive positioning against HP and Lenovo",
      "Partner performance analytics"
    ],
    clientPainPoints: [
      "50,000+ channel partners with inconsistent training",
      "Partner messaging often off-brand",
      "Limited visibility into partner sales conversations",
      "Competitive losses to HP on similar deals",
      "Partner certification tracking is manual"
    ],
    clientRequirements: [
      "Partner portal integration",
      "White-label capabilities",
      "Certification tracking and automation",
      "Competitive battle cards for partners",
      "Partner performance dashboards"
    ],
    solutionsProposed: [
      "Rev Winner Channel Partner Edition",
      "White-label partner coaching platform",
      "Integrated certification tracking",
      "AI-powered competitive battle cards"
    ],
    competitorsDiscussed: ["Impartner", "Zift Solutions", "Salesforce PRM"],
    objections: [
      {
        objection: "Our partners won't adopt another tool",
        response: "We integrate directly into your existing partner portal. Partners access coaching and insights where they already work.",
        outcome: "Interest in portal integration demo"
      }
    ],
    actionItems: [
      "Demo partner portal integration",
      "Prepare white-label proposal",
      "Share channel partner case studies"
    ],
    nextSteps: [
      "Partner portal integration review",
      "Pilot with top 100 partners",
      "White-label branding workshop"
    ],
    fullTranscript: "Patricia: Our channel business is critical, but we struggle to ensure our partners are as effective as our direct sales team...",
    messageCount: 145,
    keyQuotes: [
      "If we could bring our top partners to the level of our direct team, it would be transformational",
      "Integration with our existing portal is critical - partners won't log into another system",
      "The competitive battle cards would be huge for our partners"
    ],
    marketingHooks: [
      "Enable 50,000+ channel partners with AI coaching",
      "White-label platform for your brand",
      "Embedded in your existing partner portal"
    ],
    bestPractices: [
      "Emphasize integration over standalone tools for channel",
      "Offer white-label to preserve brand experience",
      "Lead with partner adoption strategies"
    ],
    statisticalData: {
      dealSize: 3200000,
      winProbability: 55,
      salesCycleStage: "Evaluation",
      engagementScore: 82,
      sentimentScore: 77,
      competitiveRisk: 45
    },
    featuresLiked: [
      "White-label capabilities",
      "Partner portal integration",
      "Competitive battle cards",
      "Partner performance analytics"
    ],
    featuresDisliked: [
      "No existing Dell portal integration",
      "Limited certification tracking",
      "Partner onboarding complexity"
    ],
    appreciatedAspects: [
      "Channel sales expertise",
      "Flexible white-label options",
      "Partner adoption focus"
    ]
  },
  {
    conversationId: "conv-009-ibm",
    userId: "user-ibm-001",
    clientName: "David Chen",
    companyName: "IBM",
    industry: "Technology & Consulting",
    meetingDate: new Date("2025-11-28T14:00:00Z"),
    meetingDurationMinutes: 55,
    executiveSummary: "Deep-dive with IBM's consulting sales leadership on complex solution selling challenges. Interest in AI-powered proposal assistance and deal strategy insights.",
    keyTopicsDiscussed: [
      "Complex solution sales methodology",
      "Multi-stakeholder deal management",
      "Proposal automation and assistance",
      "Consulting engagement optimization",
      "Cross-sell/upsell identification"
    ],
    clientPainPoints: [
      "Complex deals with 10+ stakeholders",
      "Proposal creation takes weeks",
      "Inconsistent solution positioning",
      "Missed cross-sell opportunities in existing accounts",
      "Long sales cycles (12-18 months)"
    ],
    clientRequirements: [
      "Stakeholder mapping and tracking",
      "AI-powered proposal assistance",
      "Solution configurator integration",
      "Account planning capabilities",
      "Integration with existing CRM"
    ],
    solutionsProposed: [
      "Rev Winner Enterprise with Deal Strategy module",
      "AI proposal assistant",
      "Stakeholder influence mapping",
      "Cross-sell recommendation engine"
    ],
    competitorsDiscussed: ["Gong", "Clari", "Conga"],
    objections: [
      {
        objection: "Our solutions are too complex for AI to understand",
        response: "We train our AI on your solution portfolio and methodology. The system learns your specific language and positioning.",
        outcome: "Interested in customization capabilities"
      },
      {
        objection: "18-month sales cycles are our reality - how can you help?",
        response: "For long cycles, our deal strategy module provides ongoing deal health monitoring and stakeholder engagement tracking throughout the process.",
        outcome: "Requested deal strategy demo"
      }
    ],
    actionItems: [
      "Demo deal strategy and stakeholder mapping",
      "Prepare proposal assistant demo",
      "Share enterprise consulting case studies"
    ],
    nextSteps: [
      "Deal strategy module demonstration",
      "Proposal assistant pilot proposal",
      "Account planning workshop"
    ],
    fullTranscript: "David: Our sales cycles are incredibly complex - we're talking about deals that can take 18 months with dozens of stakeholders...",
    messageCount: 178,
    keyQuotes: [
      "If we could cut proposal time from weeks to days, it would free our teams to focus on selling",
      "Stakeholder mapping is where deals often get lost - we need better visibility",
      "Cross-sell identification is leaving money on the table with our existing accounts"
    ],
    marketingHooks: [
      "Navigate complex deals with AI-powered stakeholder mapping",
      "Reduce proposal time from weeks to days",
      "Identify cross-sell opportunities in existing accounts"
    ],
    bestPractices: [
      "Address solution complexity with customization options",
      "Emphasize long-cycle deal management capabilities",
      "Lead with stakeholder visibility benefits"
    ],
    statisticalData: {
      dealSize: 4200000,
      winProbability: 35,
      salesCycleStage: "Discovery",
      engagementScore: 70,
      sentimentScore: 68,
      competitiveRisk: 55
    },
    featuresLiked: [
      "Stakeholder mapping",
      "AI proposal assistant",
      "Deal health monitoring",
      "Cross-sell recommendations"
    ],
    featuresDisliked: [
      "Limited consulting-specific templates",
      "No existing solution configurator integration",
      "Steep learning curve for complex features"
    ],
    appreciatedAspects: [
      "Understanding of complex sales challenges",
      "Customization flexibility",
      "Long-term partnership approach"
    ]
  },
  {
    conversationId: "conv-010-oracle",
    userId: "user-oracle-001",
    clientName: "Lisa Park",
    companyName: "Oracle",
    industry: "Enterprise Software",
    meetingDate: new Date("2025-11-25T11:00:00Z"),
    meetingDurationMinutes: 45,
    executiveSummary: "Initial discovery with Oracle's cloud sales organization. Focus on accelerating cloud adoption messaging and competitive positioning against AWS and Azure.",
    keyTopicsDiscussed: [
      "Cloud adoption sales enablement",
      "Competitive messaging against AWS/Azure",
      "Database to cloud migration positioning",
      "Enterprise license optimization",
      "Sales rep productivity"
    ],
    clientPainPoints: [
      "Cloud messaging is inconsistent across teams",
      "Reps struggle with AWS/Azure competitive objections",
      "Legacy database customers need cloud migration messaging",
      "Complex pricing/licensing requires expert positioning",
      "New cloud products launching faster than training can keep up"
    ],
    clientRequirements: [
      "Competitive intelligence for AWS and Azure",
      "Product launch enablement workflows",
      "Integration with Oracle systems",
      "Multi-language support for global teams",
      "Just-in-time learning capabilities"
    ],
    solutionsProposed: [
      "Rev Winner with competitive intelligence module",
      "Rapid product launch enablement",
      "Just-in-time coaching for new products",
      "Oracle systems integration"
    ],
    competitorsDiscussed: ["Gong", "Highspot", "Seismic"],
    objections: [
      {
        objection: "We need solutions that work with our Oracle systems",
        response: "We're building native Oracle Cloud integration and can work with your systems. Our API-first architecture allows flexible integration.",
        outcome: "Requested integration roadmap"
      }
    ],
    actionItems: [
      "Provide Oracle integration roadmap",
      "Demo competitive intelligence module",
      "Share cloud sales case studies"
    ],
    nextSteps: [
      "Integration architecture discussion",
      "Competitive intelligence pilot proposal",
      "Product launch enablement workshop"
    ],
    fullTranscript: "Lisa: Our cloud business is growing fast, but our sales teams need better support to compete with AWS and Azure...",
    messageCount: 123,
    keyQuotes: [
      "Our reps need instant access to competitive responses - they can't wait for training updates",
      "Product launches are outpacing our ability to train the field",
      "Integration with our Oracle systems is essential"
    ],
    marketingHooks: [
      "Win against AWS and Azure with real-time competitive intelligence",
      "Just-in-time coaching for rapid product launches",
      "Native Oracle Cloud integration"
    ],
    bestPractices: [
      "Lead with competitive intelligence for cloud sellers",
      "Emphasize just-in-time learning for fast-paced environments",
      "Address integration requirements upfront"
    ],
    statisticalData: {
      dealSize: 2100000,
      winProbability: 45,
      salesCycleStage: "Discovery",
      engagementScore: 74,
      sentimentScore: 72,
      competitiveRisk: 50
    },
    featuresLiked: [
      "Competitive intelligence",
      "Just-in-time coaching",
      "Product launch enablement",
      "Multi-language support"
    ],
    featuresDisliked: [
      "No existing Oracle integration",
      "Limited cloud-specific templates",
      "Competitive module still developing"
    ],
    appreciatedAspects: [
      "Understanding of cloud competitive dynamics",
      "Commitment to Oracle integration",
      "Fast-paced enablement approach"
    ]
  },
  {
    conversationId: "conv-011-accenture",
    userId: "user-accenture-001",
    clientName: "Rachel Green",
    companyName: "Accenture",
    industry: "Consulting",
    meetingDate: new Date("2025-11-20T09:00:00Z"),
    meetingDurationMinutes: 60,
    executiveSummary: "Strategic discussion with Accenture's managed services sales team. Interest in improving managed services deal management and long-term relationship selling.",
    keyTopicsDiscussed: [
      "Managed services sales optimization",
      "Long-term contract relationship management",
      "Value realization tracking",
      "Renewal optimization",
      "Executive relationship mapping"
    ],
    clientPainPoints: [
      "Multi-year deals require ongoing relationship management",
      "Value realization communication is inconsistent",
      "Renewal conversations start too late",
      "Executive sponsor changes derail deals",
      "Cross-practice coordination is challenging"
    ],
    clientRequirements: [
      "Relationship health monitoring",
      "Value realization tracking and communication",
      "Early renewal warning system",
      "Executive sponsor change alerts",
      "Cross-practice collaboration tools"
    ],
    solutionsProposed: [
      "Rev Winner Relationship Intelligence module",
      "Value realization dashboard",
      "Proactive renewal management",
      "Executive sponsor tracking"
    ],
    competitorsDiscussed: ["Gainsight", "ChurnZero", "Gong"],
    objections: [
      {
        objection: "We have a customer success platform already",
        response: "Rev Winner complements customer success tools by focusing on the sales conversation intelligence that feeds into relationship health. We integrate with Gainsight and similar platforms.",
        outcome: "Interest in integration architecture"
      }
    ],
    actionItems: [
      "Demo relationship intelligence module",
      "Prepare Gainsight integration overview",
      "Share consulting customer case studies"
    ],
    nextSteps: [
      "Relationship intelligence demo",
      "Customer success integration workshop",
      "Pilot proposal for managed services team"
    ],
    fullTranscript: "Rachel: Our managed services business relies on long-term relationships, but we struggle to systematically track relationship health...",
    messageCount: 167,
    keyQuotes: [
      "Renewals shouldn't be a last-minute panic - we need ongoing relationship monitoring",
      "When executive sponsors change, we often lose the institutional knowledge of the relationship",
      "Cross-practice coordination is where we lose opportunities"
    ],
    marketingHooks: [
      "Proactive relationship health monitoring for managed services",
      "Never miss a renewal with early warning system",
      "Track executive sponsor changes in real-time"
    ],
    bestPractices: [
      "Emphasize relationship management for managed services",
      "Position as complement to customer success tools",
      "Lead with renewal optimization benefits"
    ],
    statisticalData: {
      dealSize: 1650000,
      winProbability: 50,
      salesCycleStage: "Evaluation",
      engagementScore: 76,
      sentimentScore: 74,
      competitiveRisk: 40
    },
    featuresLiked: [
      "Relationship intelligence",
      "Value realization tracking",
      "Renewal early warning",
      "Executive sponsor tracking"
    ],
    featuresDisliked: [
      "Limited managed services-specific features",
      "No existing Gainsight integration",
      "Cross-practice coordination still basic"
    ],
    appreciatedAspects: [
      "Understanding of managed services model",
      "Relationship-first approach",
      "Integration-friendly architecture"
    ]
  },
  {
    conversationId: "conv-012-meta",
    userId: "user-meta-001",
    clientName: "Kevin Zhang",
    companyName: "Meta",
    industry: "Technology & Advertising",
    meetingDate: new Date("2025-11-18T15:00:00Z"),
    meetingDurationMinutes: 40,
    executiveSummary: "Discovery with Meta's advertising sales team focused on improving large advertiser relationship management and campaign optimization selling.",
    keyTopicsDiscussed: [
      "Large advertiser relationship management",
      "Campaign performance conversation quality",
      "Upsell and expansion opportunities",
      "Competitive positioning against Google Ads",
      "Creative strategy selling"
    ],
    clientPainPoints: [
      "Large advertisers need more strategic conversations",
      "Campaign performance discussions are reactive",
      "Missing expansion opportunities in existing accounts",
      "Competition from Google Ads intensifying",
      "Creative strategy recommendations inconsistent"
    ],
    clientRequirements: [
      "Strategic conversation frameworks",
      "Performance-based coaching prompts",
      "Expansion opportunity identification",
      "Competitive messaging for Google Ads",
      "Creative strategy templates"
    ],
    solutionsProposed: [
      "Rev Winner for Advertising Sales",
      "Performance conversation intelligence",
      "Account expansion radar",
      "Competitive messaging library"
    ],
    competitorsDiscussed: ["Gong", "SalesLoft", "Outreach"],
    objections: [
      {
        objection: "Our sales model is unique to advertising - how do you handle that?",
        response: "We've worked with advertising sales teams and understand the campaign-centric selling model. Our system can be customized for performance-based conversations.",
        outcome: "Interest in advertising-specific customization"
      }
    ],
    actionItems: [
      "Prepare advertising sales customization proposal",
      "Demo account expansion features",
      "Share advertising customer references"
    ],
    nextSteps: [
      "Customization workshop for advertising sales",
      "Pilot proposal for large advertiser team",
      "Competitive messaging development"
    ],
    fullTranscript: "Kevin: Our large advertiser relationships require a different kind of selling - it's very performance and ROI focused...",
    messageCount: 98,
    keyQuotes: [
      "Every conversation should be about how we're driving their business results",
      "We're leaving expansion dollars on the table because we don't identify opportunities early enough",
      "Google Ads competition is real - we need better competitive messaging"
    ],
    marketingHooks: [
      "Transform advertising sales with performance-focused AI coaching",
      "Identify expansion opportunities in every conversation",
      "Win against Google Ads with real-time competitive intelligence"
    ],
    bestPractices: [
      "Customize for advertising-specific sales models",
      "Emphasize ROI and performance focus",
      "Lead with expansion opportunity identification"
    ],
    statisticalData: {
      dealSize: 1400000,
      winProbability: 55,
      salesCycleStage: "Discovery",
      engagementScore: 80,
      sentimentScore: 78,
      competitiveRisk: 35
    },
    featuresLiked: [
      "Performance conversation intelligence",
      "Account expansion radar",
      "Competitive messaging",
      "Customization flexibility"
    ],
    featuresDisliked: [
      "Limited advertising-specific features out of the box",
      "No existing Meta systems integration",
      "Creative strategy templates limited"
    ],
    appreciatedAspects: [
      "Understanding of advertising sales model",
      "Customization willingness",
      "Performance-focused approach"
    ]
  }
];

export const statisticalSummary = {
  totalConversations: dummyMarketingBackups.length,
  totalDealValue: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.dealSize, 0),
  averageDealSize: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.dealSize, 0) / dummyMarketingBackups.length,
  averageWinProbability: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.winProbability, 0) / dummyMarketingBackups.length,
  averageEngagementScore: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.engagementScore, 0) / dummyMarketingBackups.length,
  averageSentimentScore: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.sentimentScore, 0) / dummyMarketingBackups.length,
  averageCompetitiveRisk: dummyMarketingBackups.reduce((sum, b) => sum + b.statisticalData.competitiveRisk, 0) / dummyMarketingBackups.length,
  industriesCovered: Array.from(new Set(dummyMarketingBackups.map(b => b.industry))),
  companiesCovered: Array.from(new Set(dummyMarketingBackups.map(b => b.companyName))),
  salesStages: {
    discovery: dummyMarketingBackups.filter(b => b.statisticalData.salesCycleStage === "Discovery").length,
    evaluation: dummyMarketingBackups.filter(b => b.statisticalData.salesCycleStage === "Evaluation").length,
    technicalValidation: dummyMarketingBackups.filter(b => b.statisticalData.salesCycleStage === "Technical Validation").length,
  },
  commonObjections: [
    { objection: "How does your AI compare to competitors?", frequency: 5 },
    { objection: "What's the total cost of ownership?", frequency: 4 },
    { objection: "Can you handle our scale?", frequency: 4 },
    { objection: "How do you integrate with our existing tools?", frequency: 6 },
    { objection: "Our team won't adopt another tool", frequency: 3 },
    { objection: "Security and compliance concerns", frequency: 5 },
  ],
  topPainPoints: [
    { painPoint: "Reps spend too much time on admin tasks", frequency: 7 },
    { painPoint: "Inconsistent messaging across teams", frequency: 6 },
    { painPoint: "Long sales cycles", frequency: 5 },
    { painPoint: "Limited visibility into deal health", frequency: 5 },
    { painPoint: "Competitive pressure", frequency: 4 },
    { painPoint: "High onboarding/ramp time", frequency: 4 },
  ],
  competitorMentions: {
    "Gong": 10,
    "Chorus.ai": 3,
    "Clari": 4,
    "SalesLoft": 3,
    "Outreach": 2,
    "Highspot": 1,
    "Seismic": 1,
    "Others": 8,
  },
};
