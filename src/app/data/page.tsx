'use client';

import { useState, useRef, useEffect } from 'react';
import * as svc from '@/lib/services/db';

interface Overview {
  season: { name: string; year: number } | null;
  gamesPlayed: number;
  gamesUpcoming: number;
  totalPitches: number;
  totalBattedBalls: number;
  totalPAs: number;
  recentGames: {
    id: number; gameDate: string; myScore: number | null; opponentScore: number | null;
    status: string | null; opponentTeamName: string | null;
  }[];
}

export default function DataPage() {
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState<'players' | 'games' | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [printPlayers, setPrintPlayers] = useState<string[][] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    svc.getStatsOverview().then((data) => setOverview(data as Overview));
  }, []);

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = filename.replace('[date]', date);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setExporting(true);
    setStatus(null);
    try {
      const json = await svc.exportAllData();
      download(json, 'thunderhawks-[date].json', 'application/json');
      setStatus({ type: 'success', message: 'Data exported successfully.' });
    } catch (e) {
      setStatus({ type: 'error', message: `Export failed: ${e}` });
    } finally {
      setExporting(false);
    }
  }

  async function handleCsvExport(type: 'players' | 'games') {
    setExportingCsv(type);
    setStatus(null);
    try {
      if (type === 'players') {
        const csv = await svc.exportPlayerStatsCSV();
        download(csv, 'thunderhawks-player-stats-[date].csv', 'text/csv');
      } else {
        const csv = await svc.exportGamesCSV();
        download(csv, 'thunderhawks-games-[date].csv', 'text/csv');
      }
      setStatus({ type: 'success', message: `${type === 'players' ? 'Player stats' : 'Game log'} CSV downloaded.` });
    } catch (e) {
      setStatus({ type: 'error', message: `CSV export failed: ${e}` });
    } finally {
      setExportingCsv(null);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setStatus(null);
    try {
      const json = await file.text();
      await svc.importAllData(json, importMode);
      setStatus({ type: 'success', message: `Data imported successfully (${importMode} mode).` });
    } catch (e) {
      setStatus({ type: 'error', message: `Import failed: ${e}` });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handlePrint() {
    // Load player stats for the print-only section, then print
    if (!printPlayers) {
      try {
        const csv = await svc.exportPlayerStatsCSV();
        const rows = csv.split('\n').map((r) => r.split(','));
        setPrintPlayers(rows);
        // Give React time to render the print section before printing
        setTimeout(() => window.print(), 100);
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Data Transfer</h1>
      <p className="text-slate-400 text-sm mb-8">
        Export your data as JSON to transfer between devices, or import a previously exported file.
      </p>

      {status && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          status.type === 'success' ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'
        }`}>
          {status.message}
        </div>
      )}

      {/* JSON Export */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-white mb-1">Export All Data</h2>
        <p className="text-slate-400 text-sm mb-4">
          Downloads a JSON file containing all seasons, teams, opponents, players, games, and pitch data. Use this to transfer data between devices.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          {exporting ? 'Exporting…' : '↓ Export JSON'}
        </button>
      </div>

      {/* CSV Exports */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-white mb-1">CSV Exports</h2>
        <p className="text-slate-400 text-sm mb-4">
          Download stats as spreadsheets for Excel or Numbers.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleCsvExport('players')}
            disabled={exportingCsv !== null}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {exportingCsv === 'players' ? 'Exporting…' : '↓ Player Stats CSV'}
          </button>
          <button
            onClick={() => handleCsvExport('games')}
            disabled={exportingCsv !== null}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {exportingCsv === 'games' ? 'Exporting…' : '↓ Game Log CSV'}
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-white mb-1">Import Data</h2>
        <p className="text-slate-400 text-sm mb-4">
          Load a previously exported JSON file. <strong className="text-white">Replace</strong> clears all existing data first; <strong className="text-white">Merge</strong> adds on top.
        </p>

        <div className="flex gap-3 mb-4">
          {(['replace', 'merge'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setImportMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                importMode === mode
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <label className={`inline-block px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
          importing ? 'bg-slate-700 text-slate-500' : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}>
          {importing ? 'Importing…' : '↑ Choose JSON File'}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      {/* Workflow tip */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
        <h3 className="text-slate-300 text-sm font-medium mb-2">Workflow: Mac → iPad</h3>
        <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
          <li>Set up season, opponents, and rosters on Mac</li>
          <li>Export data here → downloads a .json file</li>
          <li>AirDrop the .json file to iPad</li>
          <li>Open this page on iPad → Import → choose the file</li>
          <li>iPad works fully offline at the field</li>
        </ol>
      </div>

      {/* Print Season Report */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-1">Print Season Report</h2>
        <p className="text-slate-400 text-sm mb-4">
          Opens the browser print dialog with a formatted season overview and opponent batting stats.
        </p>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
        >
          🖨 Print Season Report
        </button>
      </div>

      {/* ── Print-only section ── */}
      <div className="print-only">
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>
          Grand Rapids Thunderhawks — Scouting Report
        </h1>
        <p style={{ color: '#555', fontSize: '13px', marginBottom: '20px' }}>{today}</p>

        {overview && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {overview.season ? `${overview.season.name} (${overview.season.year})` : 'All Seasons'}
            </h2>
            <table style={{ borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
              <tbody>
                {[
                  ['Games Scouted', overview.gamesPlayed],
                  ['Games Upcoming', overview.gamesUpcoming],
                  ['Pitches Tracked', overview.totalPitches],
                  ['Plate Appearances', overview.totalPAs],
                  ['Batted Balls', overview.totalBattedBalls],
                ].map(([label, val]) => (
                  <tr key={String(label)}>
                    <td style={{ padding: '2px 16px 2px 0', fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: '2px 0' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {overview.recentGames.length > 0 && (
              <>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Recent Games</h2>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      {['Date', 'Opponent', 'Score'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 12px 4px 0', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentGames.map((g) => (
                      <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 12px 4px 0' }}>{g.gameDate}</td>
                        <td style={{ padding: '4px 12px 4px 0' }}>{g.opponentTeamName ?? '—'}</td>
                        <td style={{ padding: '4px 0' }}>{g.status === 'completed' ? `${g.myScore ?? '?'} – ${g.opponentScore ?? '?'}` : g.status ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {printPlayers && printPlayers.length > 1 && (
          <>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Opponent Batting Stats</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  {printPlayers[0].map((h, i) => (
                    <th key={i} style={{ textAlign: i <= 2 ? 'left' : 'right', padding: '3px 8px 3px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printPlayers.slice(1).map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ textAlign: ci <= 2 ? 'left' : 'right', padding: '3px 8px 3px 0', whiteSpace: 'nowrap' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
