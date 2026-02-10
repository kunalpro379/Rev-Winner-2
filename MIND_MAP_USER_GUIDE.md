# Mind Map (Map/Flow) User Guide

## How to Generate Mind Map

### Step 1: Start Transcription
1. Click the **Start** button
2. Speak or play audio for at least **2-3 minutes**
3. Make sure you have meaningful conversation content

### Step 2: Find the Mind Map Section
1. Scroll down to the bottom of the page
2. Look for the **"Map/Flow"** card with a purple network icon
3. It should be below the transcript and analysis sections

### Step 3: Click Generate Button
1. Click the **"Generate"** button (or **"Regenerate"** if you've generated before)
2. You'll see a loading spinner
3. Wait **10-35 seconds** for the AI to analyze your transcript

### Step 4: View Your Mind Map
1. Once generated, you'll see a visual network diagram
2. Nodes represent different elements:
   - 🔴 **Pain Points** - Customer problems
   - 🟢 **Solutions** - Your proposed solutions
   - 🔵 **Technologies** - Tech stack mentioned
   - 🟡 **Decision Makers** - Key stakeholders
   - 🟣 **Processes** - Business workflows
   - 🟠 **Timelines** - Important dates
   - ⚪ **Compliance** - Regulatory requirements
   - 📋 **Follow-ups** - Action items

### Step 5: Interact with the Map
- **Click nodes** to see details
- **Zoom** in/out with mouse wheel
- **Pan** by dragging the canvas
- **Download** as PNG using the download button
- **Fullscreen** mode available

---

## Why Mind Map Might Not Generate

### Issue 1: Not Enough Content ❌
```
Error: Transcript too short
```

**Solution:**
- Speak for at least 2-3 minutes
- Have meaningful conversation (not just "hello")
- Include details about problems, solutions, tech stack

### Issue 2: Domain Not Found ⚠️
```
🔒 STRICT ISOLATION: Domain "Odoo" not found
```

**Solution:**
1. Go to **Settings → Train Me**
2. Click **"Create Domain"**
3. Enter domain name: **"Odoo"**
4. Add training documents about Odoo
5. Try generating mind map again

### Issue 3: Timeout ⏱️
```
Error: Map/Flow generation timeout after 35 seconds
```

**Solution:**
- Wait a bit and try again
- Check your internet connection
- Try with shorter transcript (< 5 minutes)

### Issue 4: Button Not Visible 🔍
**Solution:**
- Scroll all the way down to bottom of page
- Look for "Map/Flow" card
- Make sure you're on the Sales Assistant page

---

## What Mind Map Shows

### Technology Stack
- Current tools and systems
- Integrations mentioned
- Tech requirements

### Pain Points
- Customer problems
- Challenges faced
- Gaps in current solution

### Solutions
- Your proposed solutions
- Features discussed
- Benefits highlighted

### Decision Makers
- Key stakeholders
- Influencers
- Budget holders

### Processes
- Business workflows
- Current processes
- Desired processes

### Timelines
- Implementation dates
- Decision deadlines
- Project milestones

### Compliance
- Regulatory requirements
- Security needs
- Compliance standards

### Follow-ups
- Action items
- Next steps
- Pending decisions

---

## Tips for Better Mind Maps

### 1. Have Detailed Conversations
- Ask about current tech stack
- Discuss pain points in detail
- Mention specific tools and systems
- Talk about decision makers
- Discuss timelines and budgets

### 2. Use Domain Expertise
- Create domain in Train Me
- Add relevant training documents
- System will have better context
- More accurate mind maps

### 3. Longer Transcripts = Better Maps
- 2-3 minutes: Basic map
- 5-10 minutes: Detailed map
- 10+ minutes: Comprehensive map

### 4. Regenerate After Updates
- Add more conversation
- Click "Regenerate" button
- Map updates with new information

---

## Troubleshooting

### Problem: Button Doesn't Work
**Check:**
1. Are you logged in?
2. Do you have an active subscription?
3. Is there transcript content?
4. Check browser console for errors

### Problem: Empty Map Generated
**Possible Causes:**
1. Transcript too generic
2. No specific tech/problems mentioned
3. Domain not found (using fallback)

**Solution:**
- Have more detailed conversation
- Mention specific technologies
- Create domain in Train Me

### Problem: Slow Generation
**Normal:**
- 10-20 seconds: Normal
- 20-35 seconds: Acceptable
- 35+ seconds: Timeout (try again)

**If Always Slow:**
- Check internet connection
- Try shorter transcript
- Contact support

---

## Example Good Transcript for Mind Map

```
"We're currently using Salesforce CRM for our sales team, 
but we're having issues with the reporting features. 
Our VP of Sales, John Smith, needs better visibility 
into the pipeline. We're also using HubSpot for marketing 
automation, but the integration with Salesforce is clunky.

We need a solution that can handle both sales and marketing 
in one platform. Our budget is around $50k annually, and 
we need to implement by Q2 2026. We also have GDPR 
compliance requirements since we operate in Europe.

The main pain points are:
1. Duplicate data entry between systems
2. Slow report generation (takes 10+ minutes)
3. No mobile access for field sales team
4. Limited customization options

We're looking at Odoo as a potential replacement because 
it's more flexible and cost-effective."
```

**This transcript would generate a rich mind map with:**
- Technologies: Salesforce, HubSpot, Odoo
- Pain Points: Duplicate data, slow reports, no mobile, limited customization
- Decision Maker: John Smith (VP of Sales)
- Timeline: Q2 2026
- Budget: $50k annually
- Compliance: GDPR
- Solutions: Unified platform, better reporting, mobile access

---

## Current Status

### Timeouts
- **Mind Map Generation:** 35 seconds (increased from 25s)
- Should be sufficient for most transcripts

### Domain Support
- **Universal Mode:** ✅ Works (generic mind maps)
- **Domain-Specific:** ⚠️ Requires domain creation in Train Me

### Known Issues
- ⚠️ Occasional timeouts with very long transcripts (10+ minutes)
- ⚠️ Domain "Odoo" not found (user needs to create it)
- ✅ Generate button working
- ✅ Visual rendering working

---

## Need Help?

### Check Logs
Look for these messages:
```
🗺️ Map/Flow: Calling AI extraction...
🗺️ Map/Flow: Using user's AI engine: default
✅ Mind map generated successfully
```

### Common Error Messages
```
❌ "Transcript too short" → Add more content
❌ "Domain not found" → Create domain in Train Me
❌ "Timeout" → Try again or use shorter transcript
❌ "Generation failed" → Check logs for details
```

---

**Last Updated:** February 11, 2026
**Feature Status:** ✅ Working (requires manual trigger)
**Timeout:** 35 seconds
**Minimum Content:** 2-3 minutes of conversation
