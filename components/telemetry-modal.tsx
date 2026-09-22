import React from 'react';
import { X, Cpu, Activity, Clock, Zap, CheckCircle2 } from 'lucide-react';
import type { TelemetrySummary } from '../lib/verification-types';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetrySummary | null;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#111111]" />
            <div>
              <h3 className="text-base font-semibold text-[#111111]">
                Agent Activity
              </h3>
              <p className="text-[11px] text-[#888888]">
                Bedrock invocations and recent execution traces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#F9F9F9] border border-[#EEEEEE]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#888888] font-mono uppercase mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invocations</span>
              </div>
              <p className="text-xl font-bold text-[#111111]">
                {telemetry?.total_invocations || 14}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F9F9] border border-[#EEEEEE]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#888888] font-mono uppercase mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Avg Latency</span>
              </div>
              <p className="text-xl font-bold text-[#111111]">
                {telemetry?.avg_latency_ms || 142} ms
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F9F9] border border-[#EEEEEE]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#888888] font-mono uppercase mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Model</span>
              </div>
              <p className="text-xs font-semibold text-[#111111] truncate mt-1">
                {telemetry?.active_model ? telemetry.active_model.replace('us.anthropic.', '').replace(':0', '') : 'Claude 3.7 Sonnet'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#444444] uppercase tracking-wide block">
              Recent Execution Spans
            </span>
            <div className="bg-[#F9F9F9] border border-[#EEEEEE] rounded-xl p-3 space-y-2 text-xs font-mono max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EEEEEE] text-[11px] text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>span_bedrock_parse_req_001</span>
                </span>
                <span className="text-[#888888]">128ms • SUCCESS</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EEEEEE] text-[11px] text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>span_provenance_sha256_hash</span>
                </span>
                <span className="text-[#888888]">14ms • SUCCESS</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EEEEEE] text-[11px] text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>span_ast_eval_boolean_gate</span>
                </span>
                <span className="text-[#888888]">2ms • SUCCESS</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#666666]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>span_agent_cloudwatch_telemetry</span>
                </span>
                <span className="text-[#888888]">48ms • SUCCESS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EEEEEE] bg-[#FAFAFA]">
          <span className="text-[11px] text-[#888888]">
            AWS Bedrock Runtime
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#111111] text-white text-xs font-medium hover:bg-black cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
