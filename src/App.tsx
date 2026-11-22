import { lazy, Suspense, useState } from 'react';
import { Header } from './components/Header';
import { ComfortCheck } from './screens/ComfortCheck';
import { PickScene } from './screens/PickScene';
import { BreakScreen } from './screens/BreakScreen';
import { Reflection } from './screens/Reflection';
import type { Screen } from './state/flow';
import { useT } from './i18n';

// Heavier screens are split out of the first download.
const SceneRunner = lazy(() => import('./screens/SceneRunner'));
const ShareScreen = lazy(() => import('./screens/ShareScreen'));

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'comfort' });
  const t = useT();

  let body: JSX.Element;
  switch (screen.name) {
    case 'comfort':
      body = <ComfortCheck onStart={() => setScreen({ name: 'pick' })} />;
      break;
    case 'pick':
      body = <PickScene onPick={(sceneId) => setScreen({ name: 'scene', sceneId })} onBack={() => setScreen({ name: 'comfort' })} />;
      break;
    case 'scene':
      body = (
        <SceneRunner
          key={screen.sceneId}
          sceneId={screen.sceneId}
          onStop={(result) => setScreen({ name: 'break', result })}
          onDone={(result) => setScreen({ name: 'reflection', result })}
        />
      );
      break;
    case 'break':
      body = (
        <BreakScreen
          onReflection={() => setScreen({ name: 'reflection', result: screen.result })}
          onRestart={() => setScreen({ name: 'pick' })}
        />
      );
      break;
    case 'reflection':
      body = (
        <Reflection
          result={screen.result}
          onShare={() => setScreen({ name: 'share', result: screen.result })}
          onRestart={() => setScreen({ name: 'pick' })}
        />
      );
      break;
    case 'share':
      body = <ShareScreen result={screen.result} onRestart={() => setScreen({ name: 'pick' })} />;
      break;
  }

  // Steps 3–6 fill exactly one screen (no page scroll); the other screens are normal pages.
  const fit = screen.name === 'scene';

  return (
    <div className={fit ? 'screen-fit relative flex flex-col overflow-hidden' : 'min-h-dvh'}>
      <Header showMute={fit} />
      <main className={fit ? 'mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-3 pt-2 sm:px-4' : 'mx-auto max-w-3xl px-4 pb-10 pt-4'}>
        <Suspense fallback={<p role="status" className="py-10 text-center">{t('scene.loading')}</p>}>{body}</Suspense>
      </main>
    </div>
  );
}
