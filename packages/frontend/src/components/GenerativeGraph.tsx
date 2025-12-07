import { useAppStore } from '../stores/appStore';

interface GenerativeGraphProps {
  isGenerating?: boolean;
}

export default function GenerativeGraph({ isGenerating = false }: GenerativeGraphProps) {
  const { currentCode } = useAppStore();

  return (
    <div className="card h-full flex flex-col items-center justify-center min-h-[300px]">
      <p className="text-text-secondary mb-4">AI Thought Process</p>

      <div className="w-full text-center">
        {/* Prompt Node */}
        <div className={`inline-block px-4 py-2 rounded-lg border ${isGenerating ? 'border-x-blue bg-x-blue/10 animate-pulse' : 'border-border-primary'}`}>
          <span className="font-mono text-x-blue">[Prompt]</span>
        </div>

        {/* Connection Line */}
        <div className="flex justify-center my-3">
          <div className={`w-px h-8 ${isGenerating ? 'bg-x-blue' : 'bg-border-primary'}`}></div>
        </div>

        {/* Grok Model Node */}
        <div className={`inline-block px-4 py-2 rounded-lg border ${isGenerating ? 'border-x-blue bg-x-blue/10 animate-pulse' : 'border-border-primary'}`}>
          <span className="font-mono text-x-blue">[Grok MoE]</span>
        </div>

        {/* Expert Connections */}
        <div className="flex justify-center gap-8 my-3">
          <div className={`w-px h-8 ${isGenerating ? 'bg-x-blue' : 'bg-border-primary'}`}></div>
          <div className={`w-px h-8 ${isGenerating ? 'bg-x-blue' : 'bg-border-primary'}`}></div>
          <div className={`w-px h-8 ${isGenerating ? 'bg-x-blue' : 'bg-border-primary'}`}></div>
        </div>

        {/* Expert Nodes */}
        <div className="flex justify-center gap-4">
          <div className={`px-3 py-1 rounded border text-sm ${isGenerating ? 'border-x-blue/50' : 'border-border-primary'}`}>
            <span className="font-mono text-text-secondary">expert:rhythm</span>
          </div>
          <div className={`px-3 py-1 rounded border text-sm ${isGenerating ? 'border-x-blue/50' : 'border-border-primary'}`}>
            <span className="font-mono text-text-secondary">expert:melody</span>
          </div>
          <div className={`px-3 py-1 rounded border text-sm ${isGenerating ? 'border-x-blue/50' : 'border-border-primary'}`}>
            <span className="font-mono text-text-secondary">expert:harmony</span>
          </div>
        </div>

        {/* Output Connection */}
        {currentCode && (
          <>
            <div className="flex justify-center my-3">
              <div className="w-px h-8 bg-x-blue"></div>
            </div>
            <div className="inline-block px-4 py-2 rounded-lg border border-x-blue bg-x-blue/10">
              <span className="font-mono text-x-blue">[Strudel Code]</span>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-text-secondary mt-6">
        {isGenerating ? 'Generating pattern...' : currentCode ? 'Pattern ready' : 'Awaiting input'}
      </p>
    </div>
  );
}
