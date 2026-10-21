import { useState } from 'react';
import axios from 'axios';
import {
  Activity, UploadCloud, BrainCircuit, FileText, ReceiptText, PlugZap,
  LayoutDashboard, Sparkles, Star, MessageSquareText, TrendingUp,
  AlertCircle, CheckCircle2, Copy, Download, LoaderCircle, Menu, X,
  ArrowRight, ShieldCheck, Quote, Database
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Reviews', icon: UploadCloud },
  { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
  { id: 'pulse', label: 'Weekly Pulse', icon: FileText },
  { id: 'fees', label: 'Fee Explainer', icon: ReceiptText },
  { id: 'integrations', label: 'Integrations', icon: PlugZap },
];
const COLORS = ['#6957e8', '#b9adff', '#f0a65a'];

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function normalizedThemes(analysis) {
  const raw = analysis?.themes || analysis?.top_themes || [];
  return (Array.isArray(raw) ? raw : []).map((t, i) => ({
    name: String(t.name || t.theme || t.title || `Theme ${i + 1}`),
    count: number(t.count ?? t.review_count ?? t.frequency ?? t.mentions),
    description: t.description || t.summary || '',
  })).sort((a, b) => b.count - a.count);
}
function normalizedSentiment(analysis, reviews) {
  const s = analysis?.sentiment || analysis?.sentiment_breakdown || {};
  const read = (key, alt) => number(s[key] ?? s[alt]);
  if (s && typeof s === 'object' && !Array.isArray(s) &&
      ['positive', 'neutral', 'negative'].some(k => s[k] != null)) {
    return [
      { name: 'Positive', value: read('positive', 'Positive') },
      { name: 'Neutral', value: read('neutral', 'Neutral') },
      { name: 'Negative', value: read('negative', 'Negative') },
    ];
  }
  // Fallback uses star ratings, and is explicitly labelled as such in the UI.
  return [
    { name: 'Positive', value: reviews.filter(r => number(r.rating) >= 4).length },
    { name: 'Neutral', value: reviews.filter(r => number(r.rating) === 3).length },
    { name: 'Negative', value: reviews.filter(r => number(r.rating) <= 2).length },
  ];
}
function InfoCard({ icon: Icon, label, value, sub }) {
  return <div className="rp-stat"><div className="rp-stat-icon"><Icon size={20} /></div><div className="rp-stat-value">{value}</div><div className="rp-stat-label">{label}</div><div className="rp-stat-sub">{sub}</div></div>;
}
function SectionTitle({ eyebrow, title, description }) {
  return <div className="rp-section-title"><span className="rp-eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return <div className="rp-empty"><div className="rp-empty-icon"><Icon size={28} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="rp-btn rp-btn-primary" onClick={onAction}>{action}<ArrowRight size={16} /></button>}</div>;
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [feeExplainer, setFeeExplainer] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPulse, setGeneratingPulse] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [integrationBusy, setIntegrationBusy] = useState(false);
  const [integrationPreview, setIntegrationPreview] = useState(null);
  const [integrationResult, setIntegrationResult] = useState(null);
  const [recipient, setRecipient] = useState('');

  const themes = normalizedThemes(analysis);
  const sentiment = normalizedSentiment(analysis, reviews);
  const total = reviews.length;
  const average = total ? (reviews.reduce((sum, r) => sum + number(r.rating), 0) / total).toFixed(1) : '—';
  const topTheme = themes[0];
  const synthetic = total > 0 && reviews.every(r => r.source === 'Synthetic test');
  const feeIssue = analysis?.fee_issue;
  const quotes = Array.isArray(analysis?.quotes) ? analysis.quotes : [];

  function navigate(id) {
    setPage(id);
    setMenuOpen(false);
    setError('');
    setNotice('');
  }
  function selectFile(nextFile) {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }
    setFile(nextFile);
    setReviews([]);
    setAnalysis(null);
    setPulse(null);
    setFeeExplainer(null);
    setIntegrationPreview(null);
    setIntegrationResult(null);
    setError('');
    setNotice('');
  }
  async function handleUpload() {
    if (!file) return setError('Choose a CSV file first.');
    setUploading(true);
    setError('');
    setNotice('');
    setReviews([]);
    setAnalysis(null);
    setPulse(null);
    setFeeExplainer(null);
    setIntegrationPreview(null);
    setIntegrationResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await axios.post(`${API_URL}/api/reviews/upload`, form);
      const body = response.data;
      const parsed = body.reviews || body.data?.reviews || body.data;
      if (!Array.isArray(parsed)) throw new Error('Upload succeeded, but no reviews array was returned. Check the API response.');
      setReviews(parsed);
      setNotice(`${parsed.length} reviews uploaded successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'CSV upload failed.');
    } finally { setUploading(false); }
  }
  async function handleAnalyze() {
    if (!reviews.length) return setError('Upload a CSV first.');
    setAnalyzing(true);
    setError('');
    setNotice('');
    setAnalysis(null);
    setPulse(null);
    setFeeExplainer(null);
    setIntegrationPreview(null);
    setIntegrationResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/reviews/analyze`, { reviews });
      const result = response.data.analysis || response.data.data?.analysis || response.data.data || response.data;
      if (!result || typeof result !== 'object' || !Array.isArray(result.themes)) {
        throw new Error('The analysis response did not contain themes.');
      }
      setAnalysis(result);
      setPage('insights');
      setNotice('Gemini analysis completed.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gemini analysis failed.');
    } finally { setAnalyzing(false); }
  }
  async function handleGeneratePulse() {
    if (!analysis || !reviews.length) return setError('Analyze reviews before generating a report.');
    setGeneratingPulse(true);
    setError('');
    setNotice('');
    setPulse(null);
    try {
      const response = await axios.post(`${API_URL}/api/reviews/pulse`, { reviews, analysis });
      const report = response.data.pulse || response.data.data?.pulse;
      if (!report?.content) throw new Error('The server did not return report content.');
      setPulse(report);
      setNotice('Weekly Product Pulse generated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Report generation failed.');
    } finally { setGeneratingPulse(false); }
  }
  async function handleGenerateFeeExplainer() {
    if (!analysis) {
      setError('Please upload and analyze reviews first.');
      return;
    }

    setFeeLoading(true);
    setError('');
    setNotice('');
    setFeeExplainer(null);
    setIntegrationPreview(null);
    setIntegrationResult(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/reviews/fee-explainer`,
        { analysis }
      );
      const explainer = response.data?.feeExplainer;
      if (!response.data?.success || !explainer || !Array.isArray(explainer.bullets)) {
        throw new Error('The backend returned an invalid fee explainer.');
      }
      setFeeExplainer(explainer);
      setNotice('Fee Explainer generated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to generate Fee Explainer.');
    } finally {
      setFeeLoading(false);
    }
  }

  async function checkGoogleStatus() {
    try {
      const { data } = await axios.get(`${API_URL}/api/google/status`);
      setGoogleConnected(Boolean(data.connected));
      if (data.connected) setNotice('Google account connected.');
      else setNotice('Google account is not connected yet.');
    } catch (err) {
      setError(err.response?.data?.message || 'Google integration backend is unavailable.');
    }
  }

  function connectGoogle() {
    // A popup preserves the current React state while Google OAuth redirects.
    const popup = window.open(
      `${API_URL}/api/google/connect`,
      'reviewpulse-google-auth',
      'width=600,height=720'
    );
    if (!popup) setError('Allow popups for localhost, then try connecting again.');
    else setNotice('Complete Google authorization in the new window, then click Check connection.');
  }

  async function prepareGoogleAction(type) {
    setError('');
    setNotice('');
    setIntegrationPreview(null);
    setIntegrationResult(null);
    if (!pulse?.content || !feeExplainer?.bullets?.length) {
      setError('Generate both the Weekly Pulse and Fee Explainer first.');
      return;
    }
    setIntegrationBusy(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/google/prepare`, {
        type,
        pulse,
        feeExplainer,
        recipient: recipient.trim()
      });
      if (!data?.preview?.id) throw new Error('The backend did not return an action preview.');
      setIntegrationPreview(data.preview);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not prepare action.');
    } finally {
      setIntegrationBusy(false);
    }
  }

  async function finishGoogleAction(approved) {
    if (!integrationPreview || integrationBusy) return;
    setIntegrationBusy(true);
    setError('');
    try {
      const endpoint = approved ? 'approve' : 'reject';
      const { data } = await axios.post(`${API_URL}/api/google/${endpoint}`, {
        actionId: integrationPreview.id,
        ...(approved ? { confirm: true } : {})
      });
      if (approved) {
        setIntegrationResult(data.result);
        setNotice(data.result?.type === 'document'
          ? 'Google Doc created successfully.'
          : 'Gmail draft created. No email was sent.');
      } else {
        setNotice('Action rejected. No Google changes were made.');
      }
      setIntegrationPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google action failed.');
      // Approval may already have been consumed server-side; prepare a fresh preview.
      setIntegrationPreview(null);
    } finally {
      setIntegrationBusy(false);
    }
  }

  async function copyReport() {
    try { await navigator.clipboard.writeText(pulse.content); setNotice('Report copied to clipboard.'); }
    catch { setError('Copy failed. Please select the report text manually.'); }
  }
  function downloadReport() {
    const blob = new Blob([pulse.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'groww-weekly-product-pulse.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="rp-app">
    <aside className={`rp-sidebar ${menuOpen ? 'rp-sidebar-open' : ''}`}>
      <div className="rp-brand"><div className="rp-brand-icon"><Activity size={24}/></div><div><strong>ReviewPulse <span>AI</span></strong><small>PRODUCT INTELLIGENCE</small></div></div>
      <div className="rp-nav-heading">WORKSPACE</div>
      <nav className="rp-nav" aria-label="Main navigation">{NAV.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={`rp-nav-item ${page === item.id ? 'rp-active' : ''}`} onClick={() => navigate(item.id)}><Icon size={19}/><span>{item.label}</span></button>;
      })}</nav>
      <div className="rp-sidebar-footer"><div className="rp-sidebar-footer-icon"><Sparkles size={19}/></div><div><strong>Powered by Gemini</strong><small>AI-assisted review intelligence</small></div></div>
    </aside>
    {menuOpen && <button className="rp-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <div className="rp-main">
      <header className="rp-header"><div className="rp-header-left"><button className="rp-mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button><div><span className="rp-header-kicker">WORKSPACE / {NAV.find(n => n.id === page)?.label.toUpperCase()}</span><h1>{NAV.find(n => n.id === page)?.label}</h1></div></div><div className="rp-product-pill"><span className="rp-live-dot"/>Groww <span className="rp-pill-muted">· Feedback Intelligence</span></div></header>
      <main className="rp-content">
        {error && <div className="rp-alert rp-alert-error"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
        {notice && <div className="rp-alert rp-alert-success"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
        {synthetic && <div className="rp-test-banner"><Database size={17}/><span>Demo mode: all uploaded reviews are synthetic test data, not genuine Groww customer feedback.</span></div>}

        {page === 'overview' && <>
          <div className="rp-hero"><div><span className="rp-hero-label"><Sparkles size={15}/> AI PRODUCT INTELLIGENCE</span><h2>Turn customer feedback<br/>into <em>product clarity.</em></h2><p>Upload reviews, discover recurring issues, and generate actionable product reports—all in one workspace.</p><button className="rp-btn rp-btn-white" onClick={() => navigate('upload')}>Upload reviews <ArrowRight size={17}/></button></div><div className="rp-hero-orb"><Activity size={82} strokeWidth={1.2}/></div></div>
          <div className="rp-stats"><InfoCard icon={MessageSquareText} label="Total reviews" value={total} sub="Current uploaded dataset"/><InfoCard icon={Star} label="Average rating" value={average === '—' ? average : `${average}/5`} sub="From CSV star ratings"/><InfoCard icon={BrainCircuit} label="AI themes" value={themes.length || '—'} sub="Discovered by Gemini"/><InfoCard icon={TrendingUp} label="Top issue frequency" value={topTheme && total ? `${Math.round(topTheme.count / total * 100)}%` : '—'} sub={topTheme?.name || 'Analyze to discover'}/></div>
          {analysis ? <div className="rp-two-cols"><section className="rp-card"><div className="rp-card-head"><div><h3>Feedback themes</h3><p>Most frequent topics in your review dataset</p></div><span className="rp-tag">AI analysis</span></div><div className="rp-theme-list">{themes.slice(0,5).map((theme,i) => <div className="rp-theme-row" key={i}><div className="rp-theme-top"><span>{theme.name}</span><strong>{theme.count} reviews</strong></div><div className="rp-progress"><div style={{width: `${total ? Math.min(100,theme.count/total*100) : 0}%`}}/></div></div>)}</div></section><section className="rp-card"><div className="rp-card-head"><div><h3>Sentiment distribution</h3><p>{analysis?.sentiment ? 'AI-provided sentiment' : 'Estimated from star ratings'}</p></div></div><div className="rp-donut-layout"><div className="rp-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentiment} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={3}>{sentiment.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="rp-donut-center"><strong>{total}</strong><span>reviews</span></div></div><div className="rp-legend">{sentiment.map((s,i) => <div key={s.name}><span className="rp-legend-dot" style={{background:COLORS[i]}}/>{s.name}<strong>{s.value}</strong></div>)}</div></div></section></div> : <EmptyState icon={BrainCircuit} title="Your insights will appear here" text="Upload your review CSV and run Gemini analysis to populate dashboard metrics and charts." action="Upload a CSV" onAction={() => navigate('upload')}/>}
          {analysis && <section className="rp-card rp-observation"><div className="rp-observation-icon"><Sparkles size={22}/></div><div><h3>AI key observation</h3><p>{analysis.observation || 'See AI Insights for the complete review analysis.'}</p></div><button className="rp-text-link" onClick={() => navigate('insights')}>View insights <ArrowRight size={16}/></button></section>}
        </>}

        {page === 'upload' && <><SectionTitle eyebrow="01 / INGEST" title="Upload customer reviews" description="Start with a CSV containing review_id, date, rating, review_text, source, and source_url."/><section className="rp-card"><div className="rp-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault();selectFile(e.dataTransfer.files[0]);}}><div className="rp-drop-icon"><UploadCloud size={30}/></div><h3>Drop your CSV file here</h3><p>Or browse your computer to select a file</p><label className="rp-btn rp-btn-outline">Browse files<input type="file" accept=".csv,text/csv" onChange={e => selectFile(e.target.files[0])} hidden/></label><small>CSV format · Up to 2 MB (server limit)</small></div>{file && <div className="rp-file-row"><FileText size={19}/><div><strong>{file.name}</strong><small>{(file.size/1024).toFixed(1)} KB</small></div><button className="rp-btn rp-btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? <><LoaderCircle className="rp-spin" size={17}/>Uploading...</> : <>Upload CSV <ArrowRight size={17}/></>}</button></div>}</section>{total>0 && <section className="rp-card"><div className="rp-card-head"><div><h3>Uploaded reviews <span className="rp-count">{total}</span></h3><p>Review the imported data before running AI analysis</p></div><button className="rp-btn rp-btn-primary" disabled={analyzing} onClick={handleAnalyze}>{analyzing ? <><LoaderCircle className="rp-spin" size={17}/>Analyzing...</> : <><Sparkles size={17}/>Analyze with AI</>}</button></div><div className="rp-table-wrap"><table className="rp-table"><thead><tr><th>Review ID</th><th>Date</th><th>Rating</th><th>Customer feedback</th></tr></thead><tbody>{reviews.slice(0,30).map((r,i) => <tr key={`${r.review_id}-${i}`}><td>{r.review_id}</td><td>{r.date}</td><td><span className="rp-rating"><Star size={13} fill="currentColor"/>{r.rating}</span></td><td>{r.review_text}</td></tr>)}</tbody></table></div>{total>30 && <p className="rp-muted">Showing the first 30 reviews of {total}.</p>}</section>}</>}

        {page === 'insights' && <><SectionTitle eyebrow="02 / DISCOVER" title="AI Review Intelligence" description="Gemini identifies recurring feedback themes and highlights exact customer quotes."/>{!analysis ? <EmptyState icon={BrainCircuit} title="No analysis yet" text="Upload reviews and click Analyze with AI to discover your key customer feedback patterns." action="Go to upload" onAction={() => navigate('upload')}/> : <><div className="rp-stats rp-insight-stats"><InfoCard icon={MessageSquareText} label="Reviews analyzed" value={total} sub="Current dataset"/><InfoCard icon={BrainCircuit} label="Themes identified" value={themes.length} sub="Ranked by frequency"/><InfoCard icon={Quote} label="Verbatim quotes" value={quotes.length} sub="Linked to review IDs"/><InfoCard icon={AlertCircle} label="Recurring fee issue" value={feeIssue?.recurring === true ? 'Flagged' : 'Not found'} sub="Based on review evidence"/></div><section className="rp-card"><div className="rp-card-head"><div><h3>Top feedback themes</h3><p>Ranked by the number of reviews mentioning each issue</p></div><span className="rp-tag">Gemini</span></div><div className="rp-theme-cards">{themes.slice(0,5).map((t,i) => <div className="rp-theme-card" key={i}><div className="rp-theme-rank">{String(i+1).padStart(2,'0')}</div><div className="rp-theme-detail"><strong>{t.name}</strong>{t.description && <p>{t.description}</p>}<div className="rp-progress"><div style={{width:`${total ? Math.min(100,t.count/total*100) : 0}%`}}/></div></div><span className="rp-theme-count">{t.count} reviews</span></div>)}</div></section><div className="rp-two-cols"><section className="rp-card"><div className="rp-card-head"><div><h3>Customer voice</h3><p>Exact quotes selected by the AI</p></div><Quote size={20} className="rp-purple"/></div><div className="rp-quotes">{quotes.map((q,i) => <blockquote key={i}><p>“{q.quote || q.review_text || String(q)}”</p><footer>{q.review_id || `Quote ${i+1}`}</footer></blockquote>)}</div></section><section className="rp-card"><div className="rp-card-head"><div><h3>Recurring fee confusion</h3><p>Issue identified from customer feedback</p></div><ReceiptText size={20} className="rp-purple"/></div><div className="rp-fee-issue">{feeIssue ? <><strong>{typeof feeIssue === 'string' ? 'Fee-related feedback' : (feeIssue.title || feeIssue.issue || feeIssue.name || 'Fee-related feedback')}</strong><p>{typeof feeIssue === 'string' ? feeIssue : (feeIssue.description || feeIssue.summary || feeIssue.explanation || JSON.stringify(feeIssue))}</p></> : <p>No recurring fee issue was identified in this dataset.</p>}</div><div className="rp-insight-note"><Sparkles size={17}/><p>{analysis.observation || 'AI-generated insights are based on the uploaded review dataset.'}</p></div></section></div><div className="rp-actions"><button className="rp-btn rp-btn-primary" onClick={() => navigate('pulse')}>Continue to Weekly Pulse <ArrowRight size={17}/></button></div></>}</>}

        {page === 'pulse' && <><SectionTitle eyebrow="03 / REPORT" title="Weekly Product Pulse" description="Turn your review intelligence into a concise product management report of no more than 250 words."/>{!analysis ? <EmptyState icon={FileText} title="Analysis required" text="Analyze your uploaded reviews first. The report uses the themes and exact quotes from that analysis." action="Go to AI Insights" onAction={() => navigate('insights')}/> : <><section className="rp-card rp-report-toolbar"><div><h3>Generate your weekly report</h3><p>Includes top themes, three exact quotes, the recurring fee issue, and two product recommendations.</p></div><button className="rp-btn rp-btn-primary" disabled={generatingPulse} onClick={handleGeneratePulse}>{generatingPulse ? <><LoaderCircle className="rp-spin" size={17}/>Generating...</> : <><Sparkles size={17}/>Generate Weekly Pulse</>}</button></section>{pulse ? <section className="rp-card rp-document"><div className="rp-document-head"><div><span className="rp-eyebrow">GENERATED REPORT</span><h3>{pulse.title || 'Weekly Product Pulse — Groww'}</h3><p>{pulse.generatedAt ? new Date(pulse.generatedAt).toLocaleString() : 'Generated just now'}</p></div><span className="rp-word-count">{pulse.wordCount ?? pulse.content.trim().split(/\s+/).length} / 250 words</span></div>{(pulse.datasetType === 'synthetic_test' || synthetic) && <div className="rp-test-banner"><Database size={16}/>Synthetic test data — not genuine Groww reviews</div>}<div className="rp-document-body">{pulse.content}</div><div className="rp-document-actions"><button className="rp-btn rp-btn-outline" onClick={copyReport}><Copy size={17}/>Copy report</button><button className="rp-btn rp-btn-primary" onClick={downloadReport}><Download size={17}/>Download .txt</button></div></section> : <EmptyState icon={FileText} title="Your report is ready to be created" text="Click Generate Weekly Pulse to draft the report using your existing AI analysis."/>}</>}</>}

        {page === 'fees' && <>
          <SectionTitle eyebrow="04 / EXPLAIN" title="Fee Explainer" description="Understand recurring fee confusion with official Groww sources and review evidence." />
          {!analysis ? (
            <EmptyState icon={ReceiptText} title="Analyze reviews first" text="Upload your CSV and run Gemini analysis before generating the Fee Explainer." action="Go to Upload Reviews" onAction={() => navigate('upload')} />
          ) : <>
            <section className="rp-card rp-report-toolbar">
              <div>
                <h3>Explain fees with verified sources</h3>
                <p>Generate up to six plain-language bullets based on the detected fee issue. This step does not call Gemini.</p>
              </div>
              <button className="rp-btn rp-btn-primary" onClick={handleGenerateFeeExplainer} disabled={feeLoading}>
                {feeLoading ? <><LoaderCircle className="rp-spin" size={17}/>Generating...</> : <><ReceiptText size={17}/>Generate Fee Explainer</>}
              </button>
            </section>
            {feeExplainer ? (
              <section className="rp-card rp-fee-document">
                <div className="rp-card-head">
                  <div><span className="rp-eyebrow">SOURCE-GROUNDED EXPLANATION</span><h3>{feeExplainer.title}</h3></div>
                  <span className="rp-tag">{feeExplainer.bullets.length} bullets</span>
                </div>
                {synthetic && <div className="rp-test-banner"><Database size={17}/>Synthetic test data — not genuine Groww customer feedback.</div>}
                <p className="rp-fee-checked"><ShieldCheck size={17}/>Last checked: <strong>{feeExplainer.lastChecked || 'Not provided'}</strong></p>
                <ol className="rp-fee-bullets">
                  {feeExplainer.bullets.slice(0, 6).map((bullet, index) => <li key={index}>{bullet}</li>)}
                </ol>
                <div className="rp-fee-evidence">
                  <h4>Supporting review IDs</h4>
                  {feeExplainer.recurringFeeIssue && feeExplainer.supportingReviewIds?.length ? (
                    <div className="rp-fee-id-list">{feeExplainer.supportingReviewIds.map(id => <span className="rp-tag" key={id}>{id}</span>)}</div>
                  ) : <p>No recurring fee issue established by this analysis.</p>}
                </div>
                <div className="rp-fee-sources">
                  <h4>Official Groww sources</h4>
                  <ul>{(feeExplainer.sources || []).map(source => (
                    <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>
                  ))}</ul>
                </div>
                <p className="rp-fee-disclaimer">{feeExplainer.disclaimer}</p>
              </section>
            ) : <EmptyState icon={ReceiptText} title="Ready to explain the charges" text="Click Generate Fee Explainer to see the evidence, explanation, and official Groww sources." />}
          </>}
        </>}
        {page === 'integrations' && <>
          <SectionTitle eyebrow="05 / ACT" title="Google Docs + Gmail Approvals" description="Preview each action before creating a Google document or Gmail draft. Nothing is sent automatically." />

          <section className="rp-card rp-integration-card">
            <div className="rp-card-head"><div><h3>1. Connect Google</h3><p>Authorize Docs creation and Gmail draft creation for this local prototype.</p></div><ShieldCheck size={22} className="rp-purple" /></div>
            <div className="rp-actions">
              <button type="button" className="rp-btn rp-btn-primary" onClick={connectGoogle}>Connect Google Account</button>
              <button type="button" className="rp-btn rp-btn-outline" onClick={checkGoogleStatus}>Check connection</button>
              <span className="rp-integration-status">{googleConnected ? 'Connected' : 'Connection not confirmed'}</span>
            </div>
          </section>

          <section className="rp-card rp-integration-card">
            <div className="rp-card-head"><div><h3>2. Prepare an action</h3><p>Both the Weekly Product Pulse and Fee Explainer are required.</p></div></div>
            <label className="rp-integration-label" htmlFor="rp-draft-recipient">Gmail draft recipient (optional)</label>
            <input id="rp-draft-recipient" className="rp-integration-input" type="email" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="recipient@example.com" />
            <div className="rp-actions">
              <button type="button" className="rp-btn rp-btn-primary" disabled={integrationBusy || !pulse?.content || !feeExplainer?.bullets?.length} onClick={() => prepareGoogleAction('document')}><FileText size={17}/> Preview Google Doc</button>
              <button type="button" className="rp-btn rp-btn-outline" disabled={integrationBusy || !pulse?.content || !feeExplainer?.bullets?.length} onClick={() => prepareGoogleAction('gmail_draft')}><ReceiptText size={17}/> Preview Gmail Draft</button>
            </div>
            {(!pulse?.content || !feeExplainer?.bullets?.length) && <p className="rp-muted">Generate both reports first to unlock the preview buttons.</p>}
            {synthetic && <div className="rp-test-banner"><Database size={16}/>Demo dataset: synthetic test reviews, not genuine Groww feedback.</div>}
          </section>

          {integrationPreview && <section className="rp-card rp-integration-card">
            <div className="rp-card-head"><div><span className="rp-eyebrow">HUMAN APPROVAL REQUIRED</span><h3>3. Review the exact content</h3></div><ShieldCheck size={22} className="rp-purple"/></div>
            <p><strong>Action:</strong> {integrationPreview.type === 'document' ? 'Create a Google Doc' : 'Create a Gmail draft — do not send'}</p>
            <p><strong>Title:</strong> {integrationPreview.title}</p>
            {integrationPreview.type === 'gmail_draft' && <p><strong>Recipient:</strong> {integrationPreview.to || 'Not specified'}</p>}
            <pre className="rp-integration-preview">{integrationPreview.body}</pre>
            <div className="rp-actions">
              <button type="button" className="rp-btn rp-btn-primary" disabled={integrationBusy} onClick={() => finishGoogleAction(true)}>{integrationBusy ? <><LoaderCircle size={17} className="rp-spin"/>Processing...</> : <><ShieldCheck size={17}/>Approve and Create</>}</button>
              <button type="button" className="rp-btn rp-btn-outline" disabled={integrationBusy} onClick={() => finishGoogleAction(false)}>Reject</button>
            </div>
          </section>}

          {integrationResult && <section className="rp-card rp-integration-card">
            <h3>Action completed</h3>
            <p>{integrationResult.type === 'document' ? 'Google Doc created successfully.' : 'Gmail draft created. No email was sent.'}</p>
            {integrationResult.url && <a href={integrationResult.url} target="_blank" rel="noopener noreferrer">Open in Google ↗</a>}
          </section>}
        </>}
      </main>
      <footer className="rp-footer">ReviewPulse AI · Groww review intelligence prototype <span>AI-generated insights require human review</span></footer>
    </div>
  </div>;
}
