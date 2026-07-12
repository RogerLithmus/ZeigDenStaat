import { NodeData } from '../types'
import { MinistryIcon, hasMinistryIcon } from './MinistryIcons'

interface DetailPanelProps {
  selectedNode: NodeData | null
}

export function DetailPanel({ selectedNode }: DetailPanelProps) {
  return (
    <div className="flex w-full shrink-0 flex-col justify-between border-t border-accent/20 bg-secondary p-6 shadow-2xl lg:w-[400px] lg:border-l lg:border-t-0 lg:p-8">
      {selectedNode ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {(() => {
              if (
                selectedNode.type === 'ministry' &&
                hasMinistryIcon(selectedNode.abbrev)
              ) {
                return (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 p-2 shadow-inner">
                    <MinistryIcon
                      abbrev={selectedNode.abbrev}
                      className="size-full"
                    />
                  </div>
                )
              }
              return (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 p-2 text-2xl shadow-inner">
                  {selectedNode.type === 'parliament' ? '🏛️' : '💼'}
                </div>
              )
            })()}
            <div className="grow">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">
                {selectedNode.type === 'parliament'
                  ? 'Haupt-Organ / Bundestag'
                  : 'Bundesministerium'}
              </span>
              <h2 className="mt-1 text-2xl font-black leading-tight text-on-secondary">
                {selectedNode.name}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-accent shadow-md shadow-accent/20">
                📍 {selectedNode.location}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-accent/10 pt-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-on-secondary/50">
                Beschreibung
              </div>
              <p className="mt-1 text-sm leading-relaxed text-on-secondary/90">
                {selectedNode.description}
              </p>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-on-secondary/50">
                Leitung
              </div>
              <div className="mt-1 text-sm font-semibold text-on-secondary">
                {selectedNode.head}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-16 text-center text-on-secondary/50">
          <span className="text-3xl">🏛️</span>
          <p className="text-sm">
            Wählen Sie eine Behörde im Canvas aus, um Details anzuzeigen.
          </p>
        </div>
      )}

      <div className="mt-8 border-t border-accent/10 pt-4 text-[10px] leading-relaxed text-on-secondary/40">
        💡 Der Deutsche Bundestag steht im Zentrum der Gesetzgebung. Die
        Bundesministerien leiten die jeweiligen Bundesressorts und sind dem
        Parlament gegenüber auskunftspflichtig.
      </div>
    </div>
  )
}
