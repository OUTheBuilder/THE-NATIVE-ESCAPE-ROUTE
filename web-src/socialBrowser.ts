import { registerPlugin } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const SocialBrowser = registerPlugin<{ open(o: { url: string }): Promise<void> }>('SocialBrowser');

// Premium users get the self-closing in-app browser; others keep the old behavior.
export async function openSocial(url: string, isPremium: boolean) {
  if (isPremium) await SocialBrowser.open({ url });
  else await Browser.open({ url });
}
