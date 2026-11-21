import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import type { TaskDef } from '../scenes/types';
import { track } from '../lib/analytics';

/** The simple task during the build-up. It shows how overload takes away attention. */
export function Task({ task, sceneId }: { task: TaskDef; sceneId: string }) {
  const t = useT();
  const [answer, setAnswer] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const choices = useMemo(() => {
    if (task.type === 'countChange') return task.options.map((n) => ({ id: String(n), label: t('task.peso', { n }) }));
    return [...task.shops].sort(() => Math.random() - 0.5).map((s) => ({ id: s, label: t(`shop.${s}`) }));
  }, [task, t]);

  const correct = task.type === 'countChange' ? String(task.paid - task.fare) : task.target;
  const prompt =
    task.type === 'countChange' ? t(task.promptKey, { fare: task.fare, paid: task.paid }) : t(task.promptKey);

  const pick = (id: string) => {
    setAnswer(id);
    const ok = id === correct;
    if (ok) setDone(true);
    track('task_answer', { scene: sceneId, correct: ok });
  };

  return (
    <section aria-labelledby="task-h" className="rounded-2xl border-2 border-ink bg-white p-4">
      <h2 id="task-h" className="text-sm font-bold uppercase tracking-wide text-muted">
        {t('task.h')}
      </h2>
      <p className="mt-1 text-lg font-semibold">{prompt}</p>
      <div className={`mt-3 grid gap-2 ${task.type === 'countChange' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={done}
            aria-pressed={answer === c.id}
            onClick={() => pick(c.id)}
            className={`min-h-tap rounded-xl border-2 px-3 py-2 text-lg font-bold ${
              done && c.id === correct
                ? 'border-calm bg-calm text-white'
                : answer === c.id
                  ? 'border-stop bg-[#fde8e6]'
                  : 'border-ink bg-[#f6f1e6] hover:bg-[#ece4d2]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p role="status" className="mt-2 min-h-[1.5rem] font-semibold">
        {answer === null ? '' : done ? `✓ ${t('task.correct')}` : t('task.wrong')}
      </p>
    </section>
  );
}
