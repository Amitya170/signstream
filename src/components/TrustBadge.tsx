import React, { useState } from 'react';
import { ShieldCheck, Users, AlertTriangle, HelpCircle, Info, X } from 'lucide-react';
import { TrustLevel, Provenance } from '../core/types';

interface TrustBadgeProps {
  level: TrustLevel;
  provenance?: Provenance;
  showDetailsButton?: boolean;
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  level,
  provenance,
  showDetailsButton = true,
  className = ''
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const config = {
    VERIFIED: {
      label: 'VERIFIED',
      icon: ShieldCheck,
      bg: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50',
      description: 'Reviewed by a fluent ISL signer or Deaf community reviewer.'
    },
    COMMUNITY: {
      label: 'COMMUNITY',
      icon: Users,
      bg: 'bg-blue-950/50 text-blue-300 border-blue-500/50',
      description: 'User-contributed or personal sign template, not yet certified.'
    },
    DEMO: {
      label: 'DEMO',
      icon: HelpCircle,
      bg: 'bg-amber-950/50 text-amber-300 border-amber-500/50',
      description: 'Placeholder or simulated keyframe for research testing only.'
    },
    UNVERIFIED: {
      label: 'UNVERIFIED',
      icon: AlertTriangle,
      bg: 'bg-rose-950/50 text-rose-300 border-rose-500/50',
      description: 'No human review. May contain grammatical or phonetic errors.'
    }
  }[level] || {
    label: 'UNVERIFIED',
    icon: AlertTriangle,
    bg: 'bg-rose-950/50 text-rose-300 border-rose-500/50',
    description: 'No human review.'
  };

  const Icon = config.icon;

  return (
    <>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${className}`}
        role="status"
        aria-label={`Trust rating: ${config.label}. ${config.description}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{config.label}</span>
        {showDetailsButton && provenance && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="ml-0.5 p-0.5 hover:opacity-80 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="View provenance and verification details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </span>

      {modalOpen && provenance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provenance-title"
        >
          <div className="relative w-full max-w-md p-6 bg-slate-900 border-2 border-slate-700 rounded-2xl text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-brand-400" />
                <h3 id="provenance-title" className="text-lg font-bold">
                  Trust & Provenance Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 focus-visible:ring-2"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-400">Trust Level:</span>
                <span className="ml-2 font-bold text-brand-300">{config.label}</span>
                <p className="mt-1 text-xs text-slate-300">{config.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-400">Source:</span>
                <p className="mt-0.5 text-slate-200">{provenance.source}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-400">Licence:</span>
                <p className="mt-0.5 text-slate-200">{provenance.licence}</p>
              </div>

              {provenance.reviewer && (
                <div>
                  <span className="font-semibold text-slate-400">Reviewer:</span>
                  <p className="mt-0.5 text-slate-200">{provenance.reviewer}</p>
                </div>
              )}

              {provenance.reviewedOn && (
                <div>
                  <span className="font-semibold text-slate-400">Reviewed On:</span>
                  <p className="mt-0.5 text-slate-200">{provenance.reviewedOn}</p>
                </div>
              )}

              {provenance.notes && (
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
                  <span className="font-semibold text-slate-300">Linguistic / Research Notes:</span>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{provenance.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 min-h-touch bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
