'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSignal } from '@/contexts/signal-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SignalParams, WaveformShape } from '@/lib/types/signal';
import { 
  loadSignalParamsFromLocalStorage, 
  getFrequencyLabel, 
  getPhaseLabel,
  calculateDynamicMax,
  getWaveformLabel
} from '@/lib/signal/handler';

export function WaveformGenerator() {
  const { generateSignal, isLoading } = useSignal();
  
  // Form state
  const [start, setStart] = useState('-20');
  const [end, setEnd] = useState('20');
  const [waveform, setWaveform] = useState<WaveformShape>('sinc');
  const [amplitude, setAmplitude] = useState('1');
  const [frequency, setFrequency] = useState('1');
  const [phase, setPhase] = useState('0');
  const [interval, setInterval] = useState('0.01');
  const [bandwidth, setBandwidth] = useState('4');
  const [maxBandwidth, setMaxBandwidth] = useState(50);

  // Dynamic labels based on waveform
  const frequencyLabel = getFrequencyLabel(waveform);
  const phaseLabel = getPhaseLabel(waveform);

  // Calculate dynamic max bandwidth
  const updateDynamicMax = useCallback(() => {
    const a = parseFloat(start);
    const b = parseFloat(end);
    const currentInterval = parseFloat(interval);
    
    if (isNaN(a) || isNaN(b) || isNaN(currentInterval) || currentInterval <= 0) return;
    
    const dynamicMax = calculateDynamicMax(a, b, currentInterval);
    setMaxBandwidth(dynamicMax);
    
    if (parseFloat(bandwidth) > dynamicMax) {
      setBandwidth(dynamicMax.toString());
    }
  }, [start, end, interval, bandwidth]);

  // Load saved params on mount
  useEffect(() => {
    const params = loadSignalParamsFromLocalStorage();
    setStart(params.a.toString());
    setEnd(params.b.toString());
    setWaveform(params.signalShape);
    setAmplitude(params.amplitude.toString());
    setFrequency(params.frequency.toString());
    setPhase(params.phase.toString());
    setInterval(params.interval.toString());
    setBandwidth(params.freqrange.toString());
  }, []);

  // Update max bandwidth when dependencies change
  useEffect(() => {
    updateDynamicMax();
  }, [updateDynamicMax]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: SignalParams = {
      a: parseFloat(start),
      b: parseFloat(end),
      signalShape: waveform,
      amplitude: parseFloat(amplitude),
      frequency: parseFloat(frequency),
      phase: parseFloat(phase),
      interval: parseFloat(interval),
      freqrange: parseFloat(bandwidth),
    };

    await generateSignal(params);
  };

  return (
    <Card className="text-white border-neutral-700/40 bg-neutral-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-neutral-100">
          Function Generator
        </CardTitle>
        <CardDescription className="text-neutral-500 text-sm">Parametrized functions</CardDescription>
        <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
          Use your mouse wheel or pinch to zoom the graphs.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup className="gap-4">
            {/* Row 1: Start and End */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="start" className="text-neutral-400 text-xs font-medium">Start:</FieldLabel>
                <Input
                  type="number"
                  id="start"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  step="0.1"
                  min="-50"
                  max="-1"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="end" className="text-neutral-400 text-xs font-medium">End:</FieldLabel>
                <Input
                  type="number"
                  id="end"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  step="0.1"
                  min="1"
                  max="50"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
            </div>

            {/* Row 2: Waveform and Amplitude */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="waveform" className="text-neutral-400 text-xs font-medium">Waveform:</FieldLabel>
                <Select value={waveform} onValueChange={(v) => setWaveform(v as WaveformShape)}>
                  <SelectTrigger id="waveform" className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select waveform" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700/50">
                    <SelectItem value="square" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">Square</SelectItem>
                    <SelectItem value="triangle" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">Triangle</SelectItem>
                    <SelectItem value="sinc" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">Sinc</SelectItem>
                    <SelectItem value="cos" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">Cosine</SelectItem>
                    <SelectItem value="sin" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">Sine</SelectItem>
                    <SelectItem value="exp" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">exp</SelectItem>
                    <SelectItem value="sign" className="text-neutral-200 text-sm focus:bg-purple-500/20 focus:text-white">sign</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="amplitude" className="text-neutral-400 text-xs font-medium">Amplitude (A):</FieldLabel>
                <Input
                  type="number"
                  id="amplitude"
                  value={amplitude}
                  onChange={(e) => setAmplitude(e.target.value)}
                  step="0.1"
                  min="-100"
                  max="100"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
            </div>

            {/* Row 3: Frequency and Phase */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="frequency" className="text-neutral-400 text-xs font-medium">{frequencyLabel}</FieldLabel>
                <Input
                  type="number"
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phase" className="text-neutral-400 text-xs font-medium">{phaseLabel}</FieldLabel>
                <Input
                  type="number"
                  id="phase"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  step="0.01"
                  min="-100"
                  max="100"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
            </div>

            {/* Row 4: Interval and Frequency Range */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="interval" className="text-neutral-400 text-xs font-medium">Interval (T):</FieldLabel>
                <Input
                  type="number"
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max="0.1"
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="bandwidth" className="text-neutral-400 text-xs font-medium">
                  BW (&lt;= {maxBandwidth} Hz):
                </FieldLabel>
                <Input
                  type="number"
                  id="bandwidth"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max={maxBandwidth}
                  className="h-8 bg-neutral-900/60 border-neutral-700/50 text-neutral-200 text-sm focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-neutral-600"
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-9 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 text-sm font-medium border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-t-purple-400 border-purple-400/30 rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate function'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

