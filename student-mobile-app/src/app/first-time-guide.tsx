import { router } from 'expo-router';
import { GuideContent } from '../components/FirstRunGate';
export default function FirstTimeGuidePage() {
  return <GuideContent onDone={() => router.back()} buttonLabel="Back to App" />;
}
