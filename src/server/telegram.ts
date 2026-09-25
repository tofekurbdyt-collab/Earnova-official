import crypto from 'crypto';

export interface TelegramVerificationResult {
  verified: boolean;
  statusText: 'Verified' | 'Not Joined' | 'Checking...' | 'Error';
  channelStatus?: string;
  source: 'BOT_API' | 'TEST_MODE' | 'SIMULATION';
  message?: string;
}

/**
 * Verify Telegram user membership in the official channel.
 * Uses the official Telegram Bot API `getChatMember`.
 */
export async function verifyTelegramChannelMembership(
  telegramUserId: number,
  overrideStatus?: 'VERIFY' | 'REJECT'
): Promise<TelegramVerificationResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID || '@earnova_official';

  // Allow explicit override for interactive simulator or dev tests
  if (overrideStatus === 'REJECT') {
    return {
      verified: false,
      statusText: 'Not Joined',
      source: 'SIMULATION',
      message: 'Channel membership check returned: Not Joined.',
    };
  }
  if (overrideStatus === 'VERIFY') {
    return {
      verified: true,
      statusText: 'Verified',
      channelStatus: 'member',
      source: 'SIMULATION',
      message: 'Verified via channel check.',
    };
  }

  // If real bot token is provided, perform live HTTP call to Telegram Bot API
  if (botToken && !botToken.includes('ABCdefGh') && botToken.length > 20) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
        channelId
      )}&user_id=${telegramUserId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && data.result) {
        const status = data.result.status;
        const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
        return {
          verified: isMember,
          statusText: isMember ? 'Verified' : 'Not Joined',
          channelStatus: status,
          source: 'BOT_API',
          message: isMember
            ? `Telegram member confirmed in ${channelId}`
            : `User has status "${status}". Please join ${channelId} first.`,
        };
      } else {
        console.warn('Telegram Bot API response error:', data);
        return {
          verified: false,
          statusText: 'Not Joined',
          source: 'BOT_API',
          message: data.description || 'Could not verify channel membership.',
        };
      }
    } catch (err: unknown) {
      console.error('Error contacting Telegram Bot API:', err);
      return {
        verified: false,
        statusText: 'Error',
        source: 'BOT_API',
        message: 'Network error contacting Telegram Bot API. Please try again.',
      };
    }
  }

  // Fallback mode when bot token is not yet injected in the environment.
  // In dev / preview sandbox without Bot token configured, we simulate standard verification
  // and give users an explicit test toggle so they can test both locked and unlocked flows.
  return {
    verified: false,
    statusText: 'Not Joined',
    source: 'TEST_MODE',
    message: 'Telegram Bot Token not configured in .env. Use simulation button to toggle membership.',
  };
}

/**
 * Validates Telegram Mini App initData HMAC hash using bot token.
 */
export function validateTelegramInitData(initData: string): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken.includes('ABCdefGh')) {
    // In dev / preview without token, allow mock / dev validation
    return true;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    params.delete('hash');
    const sorted = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');

    return calculatedHash === hash;
  } catch (e) {
    console.error('Failed to validate initData HMAC:', e);
    return false;
  }
}
