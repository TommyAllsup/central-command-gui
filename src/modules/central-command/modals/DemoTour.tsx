import { ArrowLeft, ArrowRight, X } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to the demo",
    body: "This is a practice workspace. Every agent, machine, and event you see here is sample data. Nothing you do in this demo runs an AI agent or changes your projects.",
    tip: "Explore freely. Reset demo restores the sample scenario.",
  },
  {
    title: "Find the session that matters",
    body: "The command deck brings the swarm and session roster together. Select a node or a session to inspect its mission, provider, and recent work. Search by name or project, then narrow the list by state.",
    tip: "Press / to search. Ctrl+K or Cmd+K opens the command palette. The hierarchy shown here is a demo, not a live orchestrator.",
  },
  {
    title: "Give decisions your attention",
    body: "The decision inbox separates questions from routine output. Read the context, accept the suggested direction, or request an alternative. Sample decisions persist in this browser after a refresh.",
    tip: "Live provider approvals remain in the full session workspace. Demo decisions never approve a real tool call.",
  },
  {
    title: "Turn the stream down",
    body: "Filter the signal stream to decisions, completed work, or unread events. Mark signals read to clear your queue without deleting the history.",
    tip: "This triage workflow uses sample events today. Live mode currently shows recent local session activity.",
  },
  {
    title: "Connect your own work",
    body: "Choose Connect local sessions, create the local GUI account, and use your existing Claude Code or Codex sign-in. Open a discovered session to continue in its full chat and terminal workspace.",
    tip: "Each teammate runs their own local instance. Remote hosts, cmux attachment, and automatic delegation are on the roadmap.",
  },
];

/** Used by CentralCommand to explain demo boundaries and guide the first visit. */
export function DemoTour({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}) {
  const current = STEPS[step];
  return (
    <div className="cc-tour-backdrop">
      <section
        className="cc-tour"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-tour-title"
        aria-describedby="cc-tour-body"
      >
        <div className="cc-tour-header">
          <span>
            Demo walkthrough · {step + 1} of {STEPS.length}
          </span>
          <button autoFocus aria-label="Skip tutorial" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2 id="cc-tour-title">{current.title}</h2>
          <p id="cc-tour-body">{current.body}</p>
          <p className="cc-tour-tip">{current.tip}</p>
        </div>
        <div
          className="cc-tour-progress"
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={index <= step ? "complete" : ""}
            />
          ))}
        </div>
        <div className="cc-tour-actions">
          <button
            className="cc-button"
            disabled={step === 0}
            onClick={() => onStep(step - 1)}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            className="cc-button cc-primary"
            onClick={() =>
              step === STEPS.length - 1 ? onClose() : onStep(step + 1)
            }
          >
            {step === STEPS.length - 1 ? "Finish tour" : "Next"}
            <ArrowRight size={14} />
          </button>
        </div>
        {step === STEPS.length - 1 && (
          <a className="cc-tour-connect" href="/command" onClick={onClose}>
            Connect local sessions <ArrowRight size={14} />
          </a>
        )}
      </section>
    </div>
  );
}
