const SEED_DATA = {
  nodes: [
    { id: 'ga', label: 'Google Analytics', type: 'Tool', status: 'active', relevance: 5,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Analytics platform for tracking website/app traffic and user behavior.',
      projects: ['User and usage analyses', 'A/B tests', 'Ad-hoc analyses'], tags: [] },

    { id: 'bigquery', label: 'BigQuery', type: 'Database', status: 'active', relevance: 5,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: "Google's serverless data warehouse for large-scale SQL analytics.",
      projects: ['Database for various data sources'], tags: [] },

    { id: 'looker_studio', label: 'Looker Studio', type: 'Report', status: 'active', relevance: 5,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Free data visualization and reporting tool by Google.',
      projects: ['Daily Report', 'Reporting Landscape', 'Analysis Visualizations', 'Dashboards'], tags: [] },

    { id: 'firebase', label: 'Firebase', type: 'Tool', status: 'active', relevance: 3,
      owner: 'Uniq', tenant: '20 Minuten', teams: ['Uniq'],
      description: "Google's platform for mobile/web app development and analytics.",
      projects: ['App Development'], tags: [] },

    { id: 'search_console', label: 'Search Console', type: 'Tool', status: 'active', relevance: 4,
      owner: 'Oleg Tokar', tenant: '20 Minuten', teams: ['SEO'],
      description: 'Google tool to monitor website performance in search results.',
      projects: ['SEO Tool'], tags: [] },

    { id: 'gtm', label: 'GTM', type: 'Tool', status: 'active', relevance: 4,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Tag management system for deploying tracking codes without coding.',
      projects: ['Tracking'], tags: [] },

    { id: 'google_ad_manager', label: 'Google Ad Manager', type: 'Tool', status: 'active', relevance: 5,
      owner: 'Ines Feltscher', tenant: '20 Minuten', teams: ['BI'],
      description: 'Ad serving platform for managing and optimizing digital ads.',
      projects: ['Advertising data management and analysis'], tags: [] },

    { id: 'google_cloud', label: 'Google Cloud', type: 'Pipeline', status: 'active', relevance: 5,
      owner: '20 Minuten', tenant: '20 Minuten', teams: ['Data', 'BI'],
      description: 'Cloud computing platform for infrastructure and data services.',
      projects: ['Data storage', 'Data management in BigQuery', 'BigQuery Costs'], tags: [] },

    { id: 'video_cms', label: 'Video CMS', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Basil Honegger', tenant: '20 Minuten', teams: ['Editorial'],
      description: 'Content management system for video hosting and distribution.',
      projects: ['Video Performance Data'], tags: [] },

    { id: 'ods', label: 'ODS', type: 'Database', status: 'active', relevance: 4,
      owner: 'Mitja Ruggle', tenant: '20 Minuten', teams: ['Data'],
      description: 'Online Data Switzerland (ex Mediapulse) for competitor comparison.',
      projects: ['Comparison of visits and UCs with competitors'], tags: [] },

    { id: 'ma_strategy', label: 'MA Strategy', type: 'Database', status: 'active', relevance: 1,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data', 'Research'],
      description: 'Survey-based data linking socio-demographic information and consumption data with media usage data.',
      projects: ['Sales presentations', 'Reach'], tags: [] },

    { id: 'smbo', label: 'SMBO', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Marktforschung', tenant: '20 Minuten', teams: ['Data', 'Research'],
      description: 'Swiss Media Brand Observer: survey-based data for brand metrics and competitor comparison.',
      projects: ['Brand metrics by target group'], tags: [] },

    { id: 'power_bi', label: 'Power BI', type: 'Report', status: 'active', relevance: 1,
      owner: 'Marktforschung', tenant: '20 Minuten', teams: ['Research'],
      description: "Microsoft's business intelligence and data visualization tool.",
      projects: ['ODS data visualization'], tags: [] },

    { id: 's3', label: 'S3', type: 'Database', status: 'active', relevance: 5,
      owner: 'Dominic Herzog', tenant: '20 Minuten', teams: ['CDT'],
      description: "Amazon's scalable cloud object storage service.",
      projects: ['User profile', 'uid & bid', 'Beagle'], tags: [] },

    { id: 'clever_push', label: 'Clever Push', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Manuel Sutter', tenant: '20 Minuten', teams: ['Data', 'Product'],
      description: 'Push notification service for web and mobile engagement.',
      projects: ['Push data'], tags: [] },

    { id: 'supernext', label: 'SuperNext', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Mark Luxenhofer', tenant: '20 Minuten', teams: ['Data', 'Product'],
      description: 'Content delivery and publishing platform for video lift.',
      projects: ['Video Lift data'], tags: [] },

    { id: 'kilkaya', label: 'Kilkaya', type: 'Report', status: 'active', relevance: 4,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data', 'Editorial'],
      description: 'Real-time audience analytics dashboard for media companies.',
      projects: ['Real time data'], tags: [] },

    { id: 'onetrust', label: 'OneTrust', type: 'Tool', status: 'active', relevance: 4,
      owner: 'Marcel Müller', tenant: '20 Minuten', teams: ['Tech'],
      description: 'Privacy and consent management platform for GDPR/CCPA compliance.',
      projects: ['CMP'], tags: [] },

    { id: 'quantumcast', label: 'Quantumcast', type: 'Tool', status: 'active', relevance: 1,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Radio Data platform.',
      projects: ['Radio data'], tags: [] },

    { id: 'caplena', label: 'Caplena', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Matthias Strodtkötter', tenant: '20 Minuten', teams: ['Product'],
      description: 'AI-powered text analytics for open-ended survey responses.',
      projects: ['User survey data for product'], tags: [] },

    { id: 'app_analytics', label: 'App Analytics', type: 'Tool', status: 'active', relevance: 2,
      owner: 'Uniq', tenant: '20 Minuten', teams: ['Uniq'],
      description: 'Mobile application performance and user behavior tracking.',
      projects: ['App Downloads and Uninstalls'], tags: [] },

    { id: 'simplecast', label: 'Simplecast', type: 'Tool', status: 'active', relevance: 1,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Podcast hosting and analytics platform.',
      projects: ['Podcast downloads'], tags: [] },

    { id: 'mediapulse', label: 'Mediapulse', type: 'Database', status: 'deprecated', relevance: 4,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: 'Swiss audience measurement and media research provider.',
      projects: ['Comparison of visits and UCs with competitors'], tags: [] },

    { id: 'dife', label: 'DIFE', type: 'Report', status: 'active', relevance: 4,
      owner: 'Sergej Paris', tenant: '20 Minuten', teams: ['Data', 'Editorial'],
      description: 'Internal real-time audience analytics dashboard.',
      projects: ['Real time data'], tags: [] },

    { id: 'cursor', label: 'Cursor', type: 'AI', status: 'active', relevance: 3,
      owner: 'Michael Fasani', tenant: '20 Minuten', teams: ['Tech'],
      description: 'AI-powered code editor for data and developers.',
      projects: ['Development', 'Data analysis'], tags: [] },

    { id: 'vs_code', label: 'VS Code', type: 'AI', status: 'active', relevance: 3,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Tech'],
      description: 'AI-powered code editor for data and developers.',
      projects: ['Development', 'Data analysis', 'Claude Code'], tags: [] },

    { id: 'vwo', label: 'VWO', type: 'Tool', status: 'active', relevance: 3,
      owner: 'Michael Fasani', tenant: '20 Minuten', teams: ['Tech', 'Data'],
      description: 'A/B testing and conversion optimization platform.',
      projects: ['A/B tests on web'], tags: [] },

    { id: 'claude_code', label: 'Claude Code', type: 'AI', status: 'active', relevance: 3,
      owner: 'Selena Calleri', tenant: '20 Minuten', teams: ['Tech'],
      description: 'AI coding assistant by Anthropic for terminal-based development.',
      projects: ['Development', 'Data analysis', 'Presentations', 'Data overview'], tags: [] },

    { id: 'vertex_ai', label: 'Vertex AI', type: 'AI', status: 'active', relevance: 2,
      owner: 'Ludmila Kalt', tenant: '20 Minuten', teams: ['Data'],
      description: "Google Cloud's unified platform for building and deploying ML models.",
      projects: ['Qualitative article metrics'], tags: [] },

    { id: 'livingdocs_api', label: 'Livingdocs API', type: 'Pipeline', status: 'active', relevance: 5,
      owner: 'Sergej Paris', tenant: '20 Minuten', teams: ['Tech'],
      description: 'API integration to extract content data from the CMS for use in analytics and reporting tools.',
      projects: ['Quality article metrics', 'DIFE', 'Dashboards'], tags: [] },
  ],

  edges: [
    // Google Analytics
    { id: 'e01', source: 'ga', target: 'bigquery',          label: 'Data Storage',           type: 'data-flow' },
    { id: 'e02', source: 'ga', target: 'looker_studio',     label: 'Visualization',           type: 'data-flow' },
    { id: 'e03', source: 'ga', target: 'firebase',          label: 'App Data',               type: 'integration' },
    { id: 'e04', source: 'ga', target: 'gtm',               label: 'Tracking',               type: 'integration' },
    { id: 'e05', source: 'ga', target: 'google_ad_manager', label: 'Ad Data',                type: 'data-flow' },
    { id: 'e06', source: 'ga', target: 'google_cloud',      label: 'Data Storage',           type: 'data-flow' },
    { id: 'e07', source: 'ga', target: 'video_cms',         label: 'Video Performance Data', type: 'data-flow' },
    { id: 'e08', source: 'ga', target: 'cursor',            label: 'AI-based Analysis',      type: 'integration' },
    { id: 'e09', source: 'ga', target: 'vs_code',           label: 'AI-based Analysis',      type: 'integration' },
    { id: 'e10', source: 'ga', target: 'vwo',               label: 'A/B Test',               type: 'integration' },
    { id: 'e11', source: 'ga', target: 'claude_code',       label: 'AI-based Analysis',      type: 'integration' },
    // BigQuery
    { id: 'e12', source: 'bigquery', target: 'looker_studio',     label: 'Visualization', type: 'data-flow' },
    { id: 'e13', source: 'bigquery', target: 'search_console',    label: 'Data Storage',  type: 'data-flow' },
    { id: 'e14', source: 'bigquery', target: 'google_ad_manager', label: 'Data Storage',  type: 'data-flow' },
    { id: 'e15', source: 'bigquery', target: 'google_cloud',      label: 'Home',          type: 'dependency' },
    { id: 'e16', source: 'bigquery', target: 'ods',               label: 'Data Storage',  type: 'data-flow' },
    { id: 'e17', source: 'bigquery', target: 's3',                label: 'Data Storage',  type: 'data-flow' },
    { id: 'e18', source: 'bigquery', target: 'simplecast',        label: 'Data Storage',  type: 'data-flow' },
    { id: 'e19', source: 'bigquery', target: 'mediapulse',        label: 'Data Storage',  type: 'data-flow' },
    { id: 'e20', source: 'bigquery', target: 'vertex_ai',         label: 'Google Cloud',  type: 'integration' },
    { id: 'e21', source: 'bigquery', target: 'livingdocs_api',    label: 'Data Storage',  type: 'data-flow' },
    { id: 'e22', source: 'bigquery', target: 'cursor',            label: 'Analysis',      type: 'integration' },
    { id: 'e23', source: 'bigquery', target: 'vs_code',           label: 'Analysis',      type: 'integration' },
    { id: 'e24', source: 'bigquery', target: 'vwo',               label: 'Data Storage',  type: 'data-flow' },
    { id: 'e25', source: 'bigquery', target: 'claude_code',       label: 'Analysis',      type: 'integration' },
    // Looker Studio
    { id: 'e26', source: 'looker_studio', target: 'search_console',    label: 'Visualization', type: 'data-flow' },
    { id: 'e27', source: 'looker_studio', target: 'google_ad_manager', label: 'Visualization', type: 'data-flow' },
    { id: 'e28', source: 'looker_studio', target: 'ods',               label: 'Visualization', type: 'data-flow' },
    { id: 'e29', source: 'looker_studio', target: 's3',                label: 'Visualization', type: 'data-flow' },
    { id: 'e30', source: 'looker_studio', target: 'supernext',         label: 'Visualization', type: 'data-flow' },
    { id: 'e31', source: 'looker_studio', target: 'simplecast',        label: 'Visualization', type: 'data-flow' },
    { id: 'e32', source: 'looker_studio', target: 'mediapulse',        label: 'Visualization', type: 'data-flow' },
    // Firebase
    { id: 'e33', source: 'firebase', target: 'gtm',               label: 'App Tracking', type: 'integration' },
    { id: 'e34', source: 'firebase', target: 'google_ad_manager', label: 'Ad App Data',  type: 'data-flow' },
    // Google Cloud
    { id: 'e35', source: 'google_cloud', target: 'vertex_ai', label: 'Home', type: 'dependency' },
    // ODS
    { id: 'e36', source: 'ods', target: 'mediapulse', label: 'Prior Mediapulse', type: 'dependency' },
    // MA Strategy
    { id: 'e37', source: 'ma_strategy', target: 'ods', label: 'NextLevel', type: 'integration' },
    // Power BI
    { id: 'e38', source: 'power_bi', target: 'ods', label: 'Visualization', type: 'data-flow' },
    // S3
    { id: 'e39', source: 's3', target: 'livingdocs_api', label: 'Data Storage', type: 'data-flow' },
    // Kilkaya / DIFE
    { id: 'e40', source: 'kilkaya', target: 'dife', label: 'Real Time Dashboards', type: 'data-flow' },
    // Cursor
    { id: 'e41', source: 'cursor', target: 'livingdocs_api', label: 'Connected', type: 'integration' },
    // VS Code
    { id: 'e42', source: 'vs_code', target: 'livingdocs_api', label: 'Connected', type: 'integration' },
    // Vertex AI
    { id: 'e43', source: 'vertex_ai', target: 'livingdocs_api', label: 'Article Quality Metrics', type: 'data-flow' },
  ],
};
