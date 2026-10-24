import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrototypeNotice: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      {/* Persistent Top Prototype Banner */}
      <div
        className="w-full bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs sm:text-sm text-amber-200"
        role="region"
        aria-label="Prototype Disclaimer"
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 text-amber-300 shrink-0">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            RESEARCH PROTOTYPE
          </span>
          <span className="text-amber-200/90 truncate">
            Not a certified Indian Sign Language (ISL) interpreter.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="underline font-semibold hover:text-amber-100 text-xs shrink-0 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
        >
          Disclaimer & Ethics
        </button>
      </div>

      {/* Complete Honesty & Ethics Disclosure Modal */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ethics-title"
        >
          <div className="relative w-full max-w-lg p-6 bg-slate-900 border-2 border-amber-500/60 rounded-2xl text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                <h2 id="ethics-title" className="text-xl font-bold text-amber-300">
                  Prototype Honesty & Ethics
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                <h3 className="font-bold text-amber-200 text-base">Non-Certified Research Software</h3>
                <p className="mt-1">
                  Project SignStream is an early open-source research prototype designed for community exploration,
                  local accessibility, and linguistic tools. It is <strong>NOT a certified ISL interpreter</strong> and
                  must never be relied upon for life-critical medical, legal, or emergency translation without a certified human interpreter.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white">Linguistic Integrity of ISL</h4>
                <p className="mt-1">
                  Indian Sign Language (ISL) is a complete, natural language with its own morphology, spatial syntax,
                  and grammatical structure. It is <strong>not</strong> word-for-word spoken Hindi or English, and it is distinct from ASL.
                  SignStream strictly refuses to concatenate unrelated signs or fake grammatical translations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white">100% On-Device & Privacy Default</h4>
                <p className="mt-1">
                  Zero camera frames or microphone audio leave your device. All landmark tracking and model execution run directly
                  in your browser via WebAssembly and WebGPU.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white">Deaf Community Leadership</h4>
                <p className="mt-1">
                  AI and tech must not be developed "about Deaf people without Deaf people". Authentic signs require direct review
                  and sign-off from fluent ISL signers and the Deaf community.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/settings"
                onClick={() => setOpenModal(false)}
                className="text-brand-400 hover:text-brand-300 font-semibold text-sm inline-flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                View Full Documentation & Licences
              </Link>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 min-h-touch bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
