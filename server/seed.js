const pool = require('./db');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Demo seed requires ALLOW_DEMO_SEED=true outside production');
}
const seedPassword = process.env.DEMO_SEED_PASSWORD || process.env.SEED_DEMO_PASSWORD || '';
const seedEmail = process.env.DEMO_EMAIL || 'runtime-admin@example.com';
const seedName = process.env.DEMO_ADMIN_NAME || 'RuntimeAdmin';
if (seedPassword.length < 12) {
  throw new Error('DEMO_SEED_PASSWORD must contain at least 12 characters');
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop tables in reverse dependency order
    await client.query(`
      DROP TABLE IF EXISTS drip_campaigns CASCADE;
      DROP TABLE IF EXISTS themes CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS abtests CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS templates CASCADE;
      DROP TABLE IF EXISTS subscribers CASCADE;
      DROP TABLE IF EXISTS segments CASCADE;
      DROP TABLE IF EXISTS newsletters CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE newsletters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT DEFAULT '',
        subject VARCHAR(500) DEFAULT '',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE segments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        criteria JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE subscribers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'active',
        segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(500) NOT NULL,
        newsletter_id INTEGER REFERENCES newsletters(id) ON DELETE SET NULL,
        segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) DEFAULT '',
        html_content TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        sent_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        bounce_count INTEGER DEFAULT 0,
        unsubscribe_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE abtests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        variant_a TEXT DEFAULT '',
        variant_b TEXT DEFAULT '',
        metric VARCHAR(100) DEFAULT 'open_rate',
        status VARCHAR(50) DEFAULT 'draft',
        winner VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        send_at TIMESTAMP NOT NULL,
        timezone VARCHAR(100) DEFAULT 'UTC',
        recurrence VARCHAR(50) DEFAULT 'once',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE themes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        primary_color VARCHAR(20) DEFAULT '#3B82F6',
        secondary_color VARCHAR(20) DEFAULT '#1E40AF',
        font_family VARCHAR(255) DEFAULT 'Inter, sans-serif',
        header_style JSONB DEFAULT '{}',
        footer_style JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE drip_campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        trigger_event VARCHAR(100) DEFAULT 'signup',
        delay_days INTEGER DEFAULT 1,
        steps JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully');

    // Seed the explicitly configured local verification user.
    const hashedPassword = await bcrypt.hash(seedPassword, 10);
    const userResult = await client.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [seedEmail, hashedPassword, seedName]
    );
    const userId = userResult.rows[0].id;

    // Additional users
    const users = [
      ['alice@example.com', 'Alice Johnson'],
      ['bob@example.com', 'Bob Williams'],
      ['carol@example.com', 'Carol Davis'],
      ['dave@example.com', 'Dave Brown'],
      ['eve@example.com', 'Eve Martinez'],
      ['frank@example.com', 'Frank Garcia'],
      ['grace@example.com', 'Grace Wilson'],
      ['henry@example.com', 'Henry Anderson'],
      ['iris@example.com', 'Iris Taylor'],
      ['jack@example.com', 'Jack Thomas'],
      ['kate@example.com', 'Kate Moore'],
      ['leo@example.com', 'Leo Jackson'],
      ['mia@example.com', 'Mia White'],
      ['noah@example.com', 'Noah Harris'],
    ];
    for (const [email, name] of users) {
      const pw = await bcrypt.hash(seedPassword, 10);
      await client.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3)', [email, pw, name]);
    }
    console.log('Users seeded: 15');

    // Seed newsletters
    const newsletters = [
      ['Weekly Tech Roundup', '<h1>This Week in Tech</h1><p>Top stories from the world of technology including AI breakthroughs, startup funding rounds, and product launches.</p>', 'Your Weekly Tech Roundup - Edition #47', 'published'],
      ['Product Launch Announcement', '<h1>Introducing Our New Feature</h1><p>We are excited to announce our latest product update with AI-powered newsletter generation.</p>', 'Big News: AI Newsletter Generator is Here!', 'published'],
      ['Monthly Industry Insights', '<h1>Industry Insights - March 2026</h1><p>A deep dive into email marketing trends, open rate benchmarks, and best practices.</p>', 'March Industry Insights You Cannot Miss', 'published'],
      ['Customer Success Stories', '<h1>How Our Customers Succeed</h1><p>Real stories from businesses that grew their audience 300% using our platform.</p>', 'See How Others Are Growing Their Lists', 'draft'],
      ['Holiday Special Edition', '<h1>Holiday Marketing Guide</h1><p>Strategies for maximizing engagement during the holiday season with targeted email campaigns.</p>', 'Holiday Email Marketing Playbook', 'draft'],
      ['Onboarding Welcome Series', '<h1>Welcome to the Platform</h1><p>Everything you need to know to get started and send your first newsletter in under 10 minutes.</p>', 'Welcome! Here is How to Get Started', 'published'],
      ['Q1 Performance Review', '<h1>Q1 2026 Results</h1><p>Email marketing metrics, growth numbers, and key milestones from the first quarter.</p>', 'Q1 2026: Numbers That Matter', 'published'],
      ['AI in Marketing Deep Dive', '<h1>AI Transforms Email Marketing</h1><p>How artificial intelligence is revolutionizing content creation, personalization, and send-time optimization.</p>', 'The AI Revolution in Email Marketing', 'draft'],
      ['Design Tips Newsletter', '<h1>Email Design Best Practices</h1><p>Mobile-first design, accessibility tips, and color psychology for better email engagement.</p>', '10 Design Tips for Better Emails', 'published'],
      ['Subscriber Growth Hacks', '<h1>Grow Your List Fast</h1><p>Proven tactics for growing your email subscriber list including lead magnets, pop-ups, and social media strategies.</p>', 'Grow Your Email List by 500%', 'published'],
      ['Privacy and Compliance Update', '<h1>GDPR and CAN-SPAM Updates</h1><p>Latest regulatory changes affecting email marketers and how to stay compliant.</p>', 'Important: Email Compliance Updates', 'published'],
      ['Case Study: E-commerce Success', '<h1>E-commerce Email Wins</h1><p>How an online store increased revenue 40% through automated email sequences.</p>', 'E-commerce Email Strategy That Works', 'draft'],
      ['Developer Newsletter', '<h1>API Updates and Integrations</h1><p>New API endpoints, webhook improvements, and third-party integration guides.</p>', 'Developer Update: New API Features', 'published'],
      ['Year in Review 2025', '<h1>2025 Year in Review</h1><p>A look back at the biggest email marketing moments, platform updates, and community highlights.</p>', '2025: A Year of Email Innovation', 'published'],
      ['Personalization Masterclass', '<h1>Advanced Personalization</h1><p>Dynamic content, behavioral triggers, and AI-driven personalization strategies for maximum engagement.</p>', 'Master Email Personalization in 2026', 'draft'],
    ];
    const newsletterIds = [];
    for (const [title, content, subject, status] of newsletters) {
      const r = await client.query(
        'INSERT INTO newsletters (user_id, title, content, subject, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, title, content, subject, status]
      );
      newsletterIds.push(r.rows[0].id);
    }
    console.log('Newsletters seeded: 15');

    // Seed segments
    const segments = [
      ['Active Subscribers', 'Users who opened at least one email in the last 30 days', '{"activity":"active","days":30}'],
      ['New Signups', 'Subscribers who joined in the past 7 days', '{"joined_within_days":7}'],
      ['Power Users', 'Subscribers who click on every email', '{"click_rate":{"gte":0.8}}'],
      ['Inactive 90 Days', 'No opens or clicks in 90 days', '{"activity":"inactive","days":90}'],
      ['Enterprise Contacts', 'Subscribers from enterprise-level companies', '{"company_size":"enterprise"}'],
      ['Free Tier Users', 'Subscribers on the free plan', '{"plan":"free"}'],
      ['Pro Subscribers', 'Subscribers on the Pro plan', '{"plan":"pro"}'],
      ['North America', 'Subscribers located in North America', '{"region":"north_america"}'],
      ['Europe', 'Subscribers located in Europe', '{"region":"europe"}'],
      ['Tech Industry', 'Subscribers working in technology', '{"industry":"technology"}'],
      ['Marketing Professionals', 'Subscribers in marketing roles', '{"role":"marketing"}'],
      ['Re-engagement Target', 'Inactive users eligible for re-engagement campaign', '{"activity":"inactive","days":60,"eligible":true}'],
      ['High LTV', 'Subscribers with high lifetime value', '{"ltv":{"gte":500}}'],
      ['Blog Readers', 'Subscribers who came from blog signups', '{"source":"blog"}'],
      ['Webinar Attendees', 'Subscribers who attended at least one webinar', '{"webinar_attended":true}'],
    ];
    const segmentIds = [];
    for (const [name, description, criteria] of segments) {
      const r = await client.query(
        'INSERT INTO segments (user_id, name, description, criteria) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, name, description, criteria]
      );
      segmentIds.push(r.rows[0].id);
    }
    console.log('Segments seeded: 15');

    // Seed subscribers
    const subscribers = [
      ['john.doe@techcorp.com', 'John Doe', 'active'],
      ['sarah.smith@startup.io', 'Sarah Smith', 'active'],
      ['mike.chen@designstudio.com', 'Mike Chen', 'active'],
      ['emma.wilson@marketing.co', 'Emma Wilson', 'active'],
      ['james.brown@enterprise.com', 'James Brown', 'active'],
      ['lisa.taylor@freelance.dev', 'Lisa Taylor', 'active'],
      ['david.garcia@saascompany.io', 'David Garcia', 'unsubscribed'],
      ['anna.martinez@agency.com', 'Anna Martinez', 'active'],
      ['chris.anderson@bigco.com', 'Chris Anderson', 'active'],
      ['jessica.thomas@ecommerce.shop', 'Jessica Thomas', 'bounced'],
      ['ryan.jackson@fintech.io', 'Ryan Jackson', 'active'],
      ['nicole.white@healthtech.com', 'Nicole White', 'active'],
      ['kevin.harris@media.co', 'Kevin Harris', 'active'],
      ['laura.clark@education.org', 'Laura Clark', 'unsubscribed'],
      ['brian.lewis@consulting.com', 'Brian Lewis', 'active'],
      ['amanda.walker@retail.co', 'Amanda Walker', 'active'],
    ];
    for (let i = 0; i < subscribers.length; i++) {
      const [email, name, status] = subscribers[i];
      const segId = segmentIds[i % segmentIds.length];
      await client.query(
        'INSERT INTO subscribers (user_id, email, name, status, segment_id) VALUES ($1, $2, $3, $4, $5)',
        [userId, email, name, status, segId]
      );
    }
    console.log('Subscribers seeded: 16');

    // Seed campaigns
    const campaignData = [
      ['Spring Product Launch', 'sent', '2026-03-01 10:00:00'],
      ['Weekly Digest #47', 'sent', '2026-03-08 09:00:00'],
      ['Customer Appreciation Week', 'sent', '2026-02-14 08:00:00'],
      ['New Feature Announcement', 'sent', '2026-03-10 11:00:00'],
      ['Re-engagement Campaign', 'active', '2026-03-15 10:00:00'],
      ['Holiday Flash Sale', 'completed', '2025-12-20 06:00:00'],
      ['Year-End Wrap Up', 'completed', '2025-12-31 12:00:00'],
      ['Q1 Kickoff', 'sent', '2026-01-05 09:00:00'],
      ['Webinar Invitation', 'draft', null],
      ['Case Study Spotlight', 'draft', null],
      ['Referral Program Launch', 'scheduled', '2026-03-25 10:00:00'],
      ['Product Update v2.5', 'draft', null],
      ['Summer Preview Campaign', 'draft', null],
      ['Win-Back Series', 'active', '2026-03-12 08:00:00'],
      ['VIP Exclusive Content', 'sent', '2026-03-05 14:00:00'],
    ];
    const campaignIds = [];
    for (let i = 0; i < campaignData.length; i++) {
      const [name, status, scheduled_at] = campaignData[i];
      const nlId = newsletterIds[i % newsletterIds.length];
      const sgId = segmentIds[i % segmentIds.length];
      const r = await client.query(
        'INSERT INTO campaigns (user_id, name, newsletter_id, segment_id, status, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, name, nlId, sgId, status, scheduled_at]
      );
      campaignIds.push(r.rows[0].id);
    }
    console.log('Campaigns seeded: 15');

    // Seed templates
    const templateData = [
      ['Minimal Clean', 'Your Weekly Update', '<div style="max-width:600px;margin:auto;font-family:Arial"><h1 style="color:#333">{{title}}</h1><p>{{content}}</p></div>', 'minimal'],
      ['Bold Hero', 'Big Announcement Inside', '<div style="max-width:600px;margin:auto"><div style="background:#3B82F6;color:white;padding:40px;text-align:center"><h1>{{title}}</h1></div><div style="padding:20px">{{content}}</div></div>', 'announcement'],
      ['Newsletter Classic', 'This Week in {{topic}}', '<div style="max-width:600px;margin:auto;border:1px solid #ddd"><div style="background:#f8f9fa;padding:20px"><h1>{{title}}</h1></div><div style="padding:20px">{{content}}</div><div style="background:#f8f9fa;padding:10px;text-align:center"><small>Unsubscribe</small></div></div>', 'newsletter'],
      ['Product Update', 'New in {{product}}', '<div style="max-width:600px;margin:auto;font-family:Inter,sans-serif"><h2 style="color:#7C3AED">What is New</h2>{{features}}<a href="{{cta_url}}" style="background:#7C3AED;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Try It Now</a></div>', 'product'],
      ['Welcome Email', 'Welcome to {{company}}!', '<div style="max-width:600px;margin:auto;text-align:center;padding:40px"><h1>Welcome, {{name}}!</h1><p>We are thrilled to have you.</p><a href="{{cta_url}}" style="background:#10B981;color:white;padding:14px 28px;text-decoration:none;border-radius:8px">Get Started</a></div>', 'onboarding'],
      ['Event Invitation', 'You are Invited: {{event}}', '<div style="max-width:600px;margin:auto"><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:40px;text-align:center"><h1>{{event_name}}</h1><p>{{date}} | {{time}}</p></div><div style="padding:20px">{{details}}</div></div>', 'event'],
      ['Promotional', 'Special Offer Just for You', '<div style="max-width:600px;margin:auto;background:#FEF3C7;padding:20px"><h1 style="color:#D97706">{{offer_title}}</h1><p style="font-size:24px;font-weight:bold">{{discount}}% OFF</p><a href="{{cta_url}}" style="background:#D97706;color:white;padding:12px 24px;text-decoration:none">Shop Now</a></div>', 'promotional'],
      ['Survey Request', 'We Value Your Feedback', '<div style="max-width:600px;margin:auto;padding:30px;font-family:Arial"><h2>Help Us Improve</h2><p>Take our quick 2-minute survey and get a special reward.</p><a href="{{survey_url}}" style="background:#2563EB;color:white;padding:12px 24px;text-decoration:none;border-radius:4px">Take Survey</a></div>', 'survey'],
      ['Digest Two Column', 'Your Daily Digest', '<div style="max-width:600px;margin:auto"><h1>Daily Digest</h1><table width="100%"><tr><td width="50%" style="padding:10px">{{column1}}</td><td width="50%" style="padding:10px">{{column2}}</td></tr></table></div>', 'digest'],
      ['Plain Text Style', '{{subject}}', '<div style="max-width:600px;margin:auto;font-family:Georgia,serif;padding:20px"><p>Hi {{name}},</p><p>{{content}}</p><p>Best,<br>{{sender}}</p></div>', 'personal'],
      ['E-commerce Sale', 'Flash Sale: {{hours}} Hours Left!', '<div style="max-width:600px;margin:auto;background:#EF4444;color:white;text-align:center;padding:40px"><h1>FLASH SALE</h1><p style="font-size:48px;font-weight:bold">{{discount}}% OFF</p><p>Ends in {{hours}} hours</p><a href="{{url}}" style="background:white;color:#EF4444;padding:16px 32px;text-decoration:none;font-weight:bold">SHOP NOW</a></div>', 'ecommerce'],
      ['Case Study', 'How {{company}} Achieved {{result}}', '<div style="max-width:600px;margin:auto;padding:30px"><h1>Case Study</h1><div style="background:#F3F4F6;padding:20px;border-radius:8px"><h2>{{company}}</h2><p>{{summary}}</p></div><h3>Key Results</h3>{{results}}</div>', 'case_study'],
      ['Re-engagement', 'We Miss You, {{name}}!', '<div style="max-width:600px;margin:auto;text-align:center;padding:40px"><h1>It has Been a While!</h1><p>We have some exciting updates to share.</p><a href="{{url}}" style="background:#8B5CF6;color:white;padding:14px 28px;text-decoration:none;border-radius:8px">See What is New</a></div>', 'reengagement'],
      ['Testimonial Showcase', 'Hear From Our Community', '<div style="max-width:600px;margin:auto;padding:30px"><h1>What People Are Saying</h1>{{testimonials}}<div style="text-align:center;margin-top:20px"><a href="{{url}}" style="background:#059669;color:white;padding:12px 24px;text-decoration:none">Join Them</a></div></div>', 'social_proof'],
      ['API Changelog', 'API Update: Version {{version}}', '<div style="max-width:600px;margin:auto;font-family:monospace;padding:20px"><h1>Changelog v{{version}}</h1><h3>New Features</h3>{{features}}<h3>Bug Fixes</h3>{{fixes}}<h3>Breaking Changes</h3>{{breaking}}</div>', 'developer'],
    ];
    for (const [name, subject, html_content, category] of templateData) {
      await client.query(
        'INSERT INTO templates (user_id, name, subject, html_content, category) VALUES ($1, $2, $3, $4, $5)',
        [userId, name, subject, html_content, category]
      );
    }
    console.log('Templates seeded: 15');

    // Seed analytics
    const analyticsData = [
      [5200, 2340, 890, 45, 12],
      [3800, 1710, 645, 32, 8],
      [7100, 3550, 1420, 78, 23],
      [4500, 2025, 810, 38, 15],
      [2900, 1305, 522, 25, 6],
      [6300, 2835, 1134, 55, 19],
      [8200, 4100, 1640, 92, 31],
      [1500, 675, 270, 12, 3],
      [4100, 1845, 738, 35, 11],
      [5600, 2520, 1008, 48, 16],
      [3200, 1440, 576, 28, 9],
      [6800, 3060, 1224, 62, 22],
      [9500, 4275, 1710, 105, 38],
      [2100, 945, 378, 18, 5],
      [4800, 2160, 864, 42, 14],
    ];
    for (let i = 0; i < analyticsData.length; i++) {
      const [sent, opens, clicks, bounces, unsubs] = analyticsData[i];
      const cId = campaignIds[i % campaignIds.length];
      await client.query(
        'INSERT INTO analytics (user_id, campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, cId, sent, opens, clicks, bounces, unsubs]
      );
    }
    console.log('Analytics seeded: 15');

    // Seed A/B tests
    const abtestData = [
      ['Subject Line: Question vs Statement', 'open_rate', 'Is Your Email Strategy Working?', 'Your Email Strategy Needs an Upgrade', 'completed', 'A'],
      ['CTA Button Color', 'click_rate', 'Blue CTA button (#3B82F6)', 'Green CTA button (#10B981)', 'completed', 'B'],
      ['Send Time: Morning vs Afternoon', 'open_rate', 'Send at 9:00 AM EST', 'Send at 2:00 PM EST', 'completed', 'A'],
      ['Personalized vs Generic Subject', 'open_rate', 'Hey {{name}}, check this out!', 'Check out our latest update', 'running', null],
      ['Short vs Long Email', 'click_rate', '200 words with single CTA', '500 words with multiple CTAs', 'running', null],
      ['Emoji in Subject Line', 'open_rate', 'New Features Released Today', 'New Features Released Today! ✨', 'completed', 'B'],
      ['Plain Text vs HTML', 'click_rate', 'Plain text email format', 'Rich HTML with images', 'draft', null],
      ['Single Column vs Two Column', 'click_rate', 'Single column layout', 'Two column layout', 'draft', null],
      ['Header Image vs No Image', 'open_rate', 'Large hero image header', 'Text-only header', 'running', null],
      ['Discount Amount Display', 'click_rate', 'Save $50 on your next order', 'Save 25% on your next order', 'completed', 'A'],
      ['Sender Name Test', 'open_rate', 'From: Newsletter Team', 'From: Sarah at Company', 'completed', 'B'],
      ['Preheader Text Test', 'open_rate', 'Detailed preheader with key info', 'Short teaser preheader', 'running', null],
      ['Social Proof Placement', 'click_rate', 'Testimonial at top of email', 'Testimonial near CTA', 'draft', null],
      ['Urgency vs Value Subject', 'open_rate', 'Last chance: Offer expires tonight!', 'Exclusive: Your special member benefit', 'completed', 'A'],
      ['Image-Heavy vs Minimal', 'click_rate', '5 product images in grid', '1 hero image with text focus', 'running', null],
    ];
    for (let i = 0; i < abtestData.length; i++) {
      const [name, metric, va, vb, status, winner] = abtestData[i];
      const cId = campaignIds[i % campaignIds.length];
      await client.query(
        'INSERT INTO abtests (user_id, name, campaign_id, variant_a, variant_b, metric, status, winner) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, name, cId, va, vb, metric, status, winner]
      );
    }
    console.log('A/B Tests seeded: 15');

    // Seed schedules
    const scheduleData = [
      ['2026-03-18 09:00:00', 'America/New_York', 'once', 'pending'],
      ['2026-03-19 10:00:00', 'America/Chicago', 'once', 'pending'],
      ['2026-03-20 08:00:00', 'America/Los_Angeles', 'weekly', 'active'],
      ['2026-03-21 11:00:00', 'Europe/London', 'once', 'pending'],
      ['2026-03-22 14:00:00', 'Europe/Berlin', 'monthly', 'active'],
      ['2026-03-15 09:00:00', 'America/New_York', 'once', 'completed'],
      ['2026-03-10 10:00:00', 'Asia/Tokyo', 'weekly', 'active'],
      ['2026-03-25 08:00:00', 'Australia/Sydney', 'once', 'pending'],
      ['2026-04-01 09:00:00', 'America/New_York', 'monthly', 'pending'],
      ['2026-03-17 15:00:00', 'Europe/Paris', 'once', 'pending'],
      ['2026-03-28 10:00:00', 'America/Denver', 'biweekly', 'active'],
      ['2026-03-30 12:00:00', 'Asia/Singapore', 'once', 'pending'],
      ['2026-04-05 09:00:00', 'America/New_York', 'weekly', 'pending'],
      ['2026-03-08 08:00:00', 'Europe/London', 'once', 'completed'],
      ['2026-04-10 11:00:00', 'America/Chicago', 'once', 'pending'],
    ];
    for (let i = 0; i < scheduleData.length; i++) {
      const [send_at, tz, recurrence, status] = scheduleData[i];
      const cId = campaignIds[i % campaignIds.length];
      await client.query(
        'INSERT INTO schedules (user_id, campaign_id, send_at, timezone, recurrence, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, cId, send_at, tz, recurrence, status]
      );
    }
    console.log('Schedules seeded: 15');

    // Seed themes
    const themeData = [
      ['Ocean Blue', '#3B82F6', '#1E40AF', 'Inter, sans-serif', '{"background":"#EFF6FF","padding":"40px"}', '{"background":"#1E40AF","color":"white","padding":"20px"}'],
      ['Forest Green', '#059669', '#065F46', 'Nunito, sans-serif', '{"background":"#ECFDF5","padding":"40px"}', '{"background":"#065F46","color":"white","padding":"20px"}'],
      ['Sunset Orange', '#F97316', '#C2410C', 'Poppins, sans-serif', '{"background":"#FFF7ED","padding":"40px"}', '{"background":"#C2410C","color":"white","padding":"20px"}'],
      ['Royal Purple', '#7C3AED', '#5B21B6', 'DM Sans, sans-serif', '{"background":"#F5F3FF","padding":"40px"}', '{"background":"#5B21B6","color":"white","padding":"20px"}'],
      ['Midnight Dark', '#1F2937', '#111827', 'JetBrains Mono, monospace', '{"background":"#111827","color":"white","padding":"40px"}', '{"background":"#000000","color":"#9CA3AF","padding":"20px"}'],
      ['Coral Pink', '#F43F5E', '#BE123C', 'Quicksand, sans-serif', '{"background":"#FFF1F2","padding":"40px"}', '{"background":"#BE123C","color":"white","padding":"20px"}'],
      ['Sky Light', '#0EA5E9', '#0369A1', 'Source Sans Pro, sans-serif', '{"background":"#F0F9FF","padding":"40px"}', '{"background":"#0369A1","color":"white","padding":"20px"}'],
      ['Warm Amber', '#D97706', '#92400E', 'Merriweather, serif', '{"background":"#FFFBEB","padding":"40px"}', '{"background":"#92400E","color":"white","padding":"20px"}'],
      ['Clean Mono', '#374151', '#1F2937', 'IBM Plex Mono, monospace', '{"background":"#F9FAFB","padding":"40px","borderBottom":"2px solid #374151"}', '{"background":"#F3F4F6","color":"#374151","padding":"20px"}'],
      ['Lavender Dream', '#8B5CF6', '#6D28D9', 'Raleway, sans-serif', '{"background":"#EDE9FE","padding":"40px"}', '{"background":"#6D28D9","color":"white","padding":"20px"}'],
      ['Emerald Professional', '#10B981', '#047857', 'Roboto, sans-serif', '{"background":"#D1FAE5","padding":"40px"}', '{"background":"#047857","color":"white","padding":"20px"}'],
      ['Crimson Bold', '#DC2626', '#991B1B', 'Oswald, sans-serif', '{"background":"#FEF2F2","padding":"40px"}', '{"background":"#991B1B","color":"white","padding":"20px"}'],
      ['Slate Minimal', '#64748B', '#334155', 'Inter, sans-serif', '{"background":"#F8FAFC","padding":"40px"}', '{"background":"#334155","color":"#CBD5E1","padding":"20px"}'],
      ['Teal Fresh', '#14B8A6', '#0F766E', 'Lato, sans-serif', '{"background":"#F0FDFA","padding":"40px"}', '{"background":"#0F766E","color":"white","padding":"20px"}'],
      ['Gold Premium', '#EAB308', '#A16207', 'Playfair Display, serif', '{"background":"#FEFCE8","padding":"40px"}', '{"background":"#A16207","color":"white","padding":"20px"}'],
    ];
    for (const [name, pc, sc, ff, hs, fs] of themeData) {
      await client.query(
        'INSERT INTO themes (user_id, name, primary_color, secondary_color, font_family, header_style, footer_style) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, name, pc, sc, ff, hs, fs]
      );
    }
    console.log('Themes seeded: 15');

    // Seed drip campaigns
    const dripData = [
      ['Welcome Series', 'Onboard new subscribers with a 5-email welcome sequence', 'signup', 1, '[{"day":0,"subject":"Welcome!","action":"send_email"},{"day":1,"subject":"Getting Started Guide","action":"send_email"},{"day":3,"subject":"Top Features","action":"send_email"},{"day":5,"subject":"Pro Tips","action":"send_email"},{"day":7,"subject":"Ready to Upgrade?","action":"send_email"}]', 'active'],
      ['Trial Conversion', 'Convert free trial users to paid subscribers', 'trial_start', 2, '[{"day":0,"subject":"Your Trial Has Started","action":"send_email"},{"day":3,"subject":"Have You Tried This?","action":"send_email"},{"day":7,"subject":"Halfway Through Your Trial","action":"send_email"},{"day":12,"subject":"Trial Ending Soon","action":"send_email"},{"day":14,"subject":"Last Day of Your Trial","action":"send_email"}]', 'active'],
      ['Re-engagement Flow', 'Win back inactive subscribers', 'inactive_30_days', 3, '[{"day":0,"subject":"We Miss You!","action":"send_email"},{"day":5,"subject":"Here Is What You Missed","action":"send_email"},{"day":10,"subject":"Special Offer Inside","action":"send_email"},{"day":15,"subject":"Last Chance","action":"send_email"}]', 'active'],
      ['Post-Purchase Follow-up', 'Engage customers after a purchase', 'purchase', 1, '[{"day":0,"subject":"Thank You for Your Purchase","action":"send_email"},{"day":3,"subject":"How to Get the Most Out of It","action":"send_email"},{"day":7,"subject":"Leave a Review?","action":"send_email"},{"day":14,"subject":"You Might Also Like...","action":"send_email"}]', 'active'],
      ['Onboarding Checklist', 'Guide users through initial setup', 'account_created', 0, '[{"day":0,"subject":"Complete Your Profile","action":"send_email"},{"day":1,"subject":"Import Your Contacts","action":"send_email"},{"day":2,"subject":"Create Your First Newsletter","action":"send_email"},{"day":4,"subject":"Set Up Analytics","action":"send_email"},{"day":7,"subject":"You Are All Set!","action":"send_email"}]', 'active'],
      ['Upgrade Nudge', 'Encourage free users to upgrade', 'feature_limit_hit', 1, '[{"day":0,"subject":"You Have Hit a Limit","action":"send_email"},{"day":2,"subject":"Unlock More with Pro","action":"send_email"},{"day":5,"subject":"Pro Users Get 3x Results","action":"send_email"}]', 'draft'],
      ['Birthday Campaign', 'Send personalized birthday offers', 'birthday', 0, '[{"day":-1,"subject":"Birthday Surprise Coming!","action":"send_email"},{"day":0,"subject":"Happy Birthday! Gift Inside","action":"send_email"},{"day":1,"subject":"Birthday Offer Expires Soon","action":"send_email"}]', 'active'],
      ['Webinar Follow-up', 'Nurture webinar attendees', 'webinar_attended', 1, '[{"day":0,"subject":"Thanks for Attending!","action":"send_email"},{"day":1,"subject":"Webinar Recording + Slides","action":"send_email"},{"day":3,"subject":"Key Takeaways","action":"send_email"},{"day":7,"subject":"Ready to Take Action?","action":"send_email"}]', 'draft'],
      ['Cart Abandonment', 'Recover abandoned carts', 'cart_abandoned', 0, '[{"day":0,"subject":"You Left Something Behind","action":"send_email"},{"day":1,"subject":"Still Interested?","action":"send_email"},{"day":3,"subject":"10% Off Your Cart","action":"send_email"}]', 'active'],
      ['Content Education Series', 'Educate subscribers about email marketing', 'signup', 3, '[{"day":0,"subject":"Email Marketing 101","action":"send_email"},{"day":3,"subject":"Writing Great Subject Lines","action":"send_email"},{"day":6,"subject":"Segmentation Strategies","action":"send_email"},{"day":9,"subject":"A/B Testing Guide","action":"send_email"},{"day":12,"subject":"Advanced Automation","action":"send_email"}]', 'draft'],
      ['Feature Announcement Drip', 'Announce new features over time', 'manual', 2, '[{"day":0,"subject":"Exciting New Feature!","action":"send_email"},{"day":3,"subject":"How to Use the New Feature","action":"send_email"},{"day":7,"subject":"Tips and Tricks","action":"send_email"}]', 'draft'],
      ['Annual Review', 'Year-end engagement campaign', 'annual_trigger', 0, '[{"day":0,"subject":"Your Year in Review","action":"send_email"},{"day":2,"subject":"Top Achievements","action":"send_email"},{"day":5,"subject":"Plans for Next Year?","action":"send_email"}]', 'draft'],
      ['Referral Program', 'Encourage referrals from active users', 'milestone_reached', 1, '[{"day":0,"subject":"Share the Love, Get Rewarded","action":"send_email"},{"day":5,"subject":"Your Referral Link Inside","action":"send_email"},{"day":10,"subject":"Top Referrers This Month","action":"send_email"}]', 'active'],
      ['Feedback Collection', 'Gather user feedback at key moments', 'usage_milestone', 2, '[{"day":0,"subject":"Quick Question for You","action":"send_email"},{"day":5,"subject":"Your Feedback Matters","action":"send_email"},{"day":10,"subject":"Thank You + Results","action":"send_email"}]', 'active'],
      ['Seasonal Promotion', 'Seasonal marketing automation', 'seasonal_trigger', 1, '[{"day":0,"subject":"Seasonal Greetings!","action":"send_email"},{"day":2,"subject":"Limited Time Offer","action":"send_email"},{"day":5,"subject":"Offer Ending Soon","action":"send_email"},{"day":7,"subject":"Last Chance!","action":"send_email"}]', 'draft'],
    ];
    for (const [name, desc, trigger, delay, steps, status] of dripData) {
      await client.query(
        'INSERT INTO drip_campaigns (user_id, name, description, trigger_event, delay_days, steps, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, name, desc, trigger, delay, steps, status]
      );
    }
    console.log('Drip campaigns seeded: 15');

    await client.query('COMMIT');
    console.log('\nSeeding completed successfully!');
    console.log(`Verification user: ${seedEmail}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
