import { AI_PROVIDERS, AiProviderId, AppConfig } from '../types';

const VISION_PROVIDER_PRIORITY: AiProviderId[] = ['gemini', 'anthropic', 'openai'];

export function getProviderInfo(provider: AiProviderId) {
  return AI_PROVIDERS.find(item => item.id === provider);
}

export function isVisionProvider(provider: AiProviderId): boolean {
  return Boolean(getProviderInfo(provider)?.visionEnabled);
}

export function getActiveApiKey(config: AppConfig): string {
  const provider = config.active_ai_provider;
  const providerKey = config.api_keys?.[provider]?.trim();
  if (providerKey) return providerKey;
  return provider === 'anthropic' ? config.api_key.trim() : '';
}

export function resolveVisionProvider(config: AppConfig): {
  provider: AiProviderId;
  apiKey: string;
  usedFallback: boolean;
} {
  const active = config.active_ai_provider;
  const activeKey = getActiveApiKey(config);
  if (isVisionProvider(active) && activeKey) {
    return { provider: active, apiKey: activeKey, usedFallback: false };
  }

  for (const provider of VISION_PROVIDER_PRIORITY) {
    const key =
      config.api_keys?.[provider]?.trim() ||
      (provider === 'anthropic' ? config.api_key.trim() : '');
    if (key) {
      return { provider, apiKey: key, usedFallback: provider !== active };
    }
  }

  const provider = isVisionProvider(active) ? active : 'gemini';
  return {
    provider,
    apiKey: '',
    usedFallback: provider !== active,
  };
}
