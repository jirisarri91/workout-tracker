'use client';

export interface BlockChipData {
  name: string;
  exerciseCount: number;
  doneCount: number;
}

interface Props {
  blocks: BlockChipData[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function BlockMinimap({ blocks, activeIndex, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
      {blocks.map((block, i) => {
        const isActive = i === activeIndex;
        const isDone = block.exerciseCount > 0 && block.doneCount >= block.exerciseCount;
        const label = block.name || `Block ${i + 1}`;

        return (
          <button
            key={`${block.name}-${i}`}
            onClick={() => onSelect(i)}
            className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-orange-500 text-white shadow-sm'
                : isDone
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300'
            }`}
          >
            {isDone && !isActive && <span className="text-green-500 text-xs">✓</span>}
            <span>{label}</span>
            {!isDone && (
              <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shrink-0 ${
                isActive ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {block.exerciseCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
