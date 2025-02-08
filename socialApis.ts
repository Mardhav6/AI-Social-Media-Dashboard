import { supabase } from './supabase';

// Instagram Graph API
async function fetchInstagramData(accessToken: string) {
  const response = await fetch(
    `https://graph.instagram.com/me?fields=followers_count,media_count&access_token=${accessToken}`
  );
  const data = await response.json();
  
  // Update Supabase with Instagram data
  await supabase
    .from('platform_metrics')
    .upsert({
      platform: 'instagram',
      followers: data.followers_count,
      total_posts: data.media_count,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'platform'
    });
}

// YouTube Data API
async function fetchYouTubeData(apiKey: string, channelId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
  );
  const data = await response.json();
  const stats = data.items[0].statistics;
  
  await supabase
    .from('platform_metrics')
    .upsert({
      platform: 'youtube',
      followers: stats.subscriberCount,
      total_posts: stats.videoCount,
      avg_views: Math.floor(stats.viewCount / stats.videoCount),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'platform'
    });
}

// Google Search Console API
async function fetchSearchConsoleData(accessToken: string) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
  
  const response = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites/YOUR_SITE_URL/searchAnalytics/query',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }),
    }
  );
  const data = await response.json();
  
  await supabase
    .from('platform_metrics')
    .upsert({
      platform: 'google',
      search_impressions: data.totals?.impressions || 0,
      click_rate: (data.totals?.ctr || 0) * 100,
      avg_position: data.totals?.position || 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'platform'
    });
}

export async function updateSocialMetrics(config: {
  instagramToken?: string;
  youtubeKey?: string;
  youtubeChannelId?: string;
  googleToken?: string;
}) {
  try {
    const promises = [];
    
    if (config.instagramToken) {
      promises.push(fetchInstagramData(config.instagramToken));
    }
    
    if (config.youtubeKey && config.youtubeChannelId) {
      promises.push(fetchYouTubeData(config.youtubeKey, config.youtubeChannelId));
    }
    
    if (config.googleToken) {
      promises.push(fetchSearchConsoleData(config.googleToken));
    }
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error updating social metrics:', error);
    return false;
  }
}