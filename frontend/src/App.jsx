
import { useState } from 'react'
import axios from 'axios'
import { Upload, Check, X, FileText, Loader2, RefreshCw } from 'lucide-react'
import './App.css'

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null)
  const [processedFile, setProcessedFile] = useState(null)
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload and get processed file
      const res = await axios.post(`${API_BASE}/suggest-changes/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: 'blob'
      });

      // The backend returns the file blob, but we know the name is likely "suggested_" + original
      // Wait, my backend logic returns FileResponse. 
      // I need to know the *filename* to query changes.
      // The backend saves it as `suggested_{file.filename}`.

      const suggestedName = `suggested_${file.name}`; // Simplified assumption
      setProcessedFile(suggestedName);

      // 2. Fetch changes
      await fetchChanges(suggestedName);

    } catch (err) {
      console.error(err);
      alert("Error processing file");
    } finally {
      setLoading(false);
    }
  };

  const fetchChanges = async (filename) => {
    try {
      const res = await axios.get(`${API_BASE}/changes/${filename}`);
      setChanges(res.data.changes || []);
    } catch (err) {
      console.error(err);
    }
  }


  const handleAction = async (change, action) => {
    setProcessing(true);
    try {
      if (change.type === 'update') {
        // Handle update: Apply action to BOTH IDs
        // Accept Update = Accept Deletion (remove old) + Accept Insertion (keep new)
        // Reject Update = Reject Deletion (keep old) + Reject Insertion (remove new)

        for (const id of change.ids) {
          await axios.post(`${API_BASE}/changes/${processedFile}/${id}/${action}`);
        }

      } else {
        // Single action
        await axios.post(`${API_BASE}/changes/${processedFile}/${change.id}/${action}`);
      }

      // Remove from local state
      setChanges(prev => prev.filter(c =>
        change.type === 'update' ? c !== change : c.id !== change.id
      ));

    } catch (err) {
      console.error(err);
      alert("Failed to apply action");
    } finally {
      setProcessing(false);
    }
  }


  const handleDownload = (e) => {
    e.preventDefault();
    if (!processedFile) return;

    // Direct download via backend URL. 
    // The backend sets 'Content-Disposition: attachment; filename="..."'
    // This allows the browser to handle the filename correctly even across origins.
    window.location.href = `${API_BASE}/download/${processedFile}`;
  };

  return (
    <div className="container">
      <header className="hero">
        <h1>Docx AI Agent</h1>
        <p>Upload your document and let AI suggest improvements.</p>
      </header>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input type="file" id="file" onChange={handleFileChange} accept=".docx" />
          <label htmlFor="file" className="file-label">
            <Upload size={20} />
            {file ? file.name : "Choose a .docx file"}
          </label>
        </div>

        <button
          className="process-btn"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? <Loader2 className="spin" /> : "Process & Analyze"}
        </button>
      </div>

      {processedFile && (
        <div className="workspace">
          <div className="changes-panel">

            <div className="panel-header">
              <h2>Detected Suggestions ({changes.length})</h2>
              <div className="panel-actions">
                <button className="icon-btn" onClick={() => fetchChanges(processedFile)} title="Refresh">
                  <RefreshCw size={16} />
                </button>
                <a
                  href="#"
                  onClick={handleDownload}
                  className="download-btn"
                >
                  <FileText size={16} /> Download
                </a>
              </div>
            </div>

            <div className="changes-list">
              {changes.length === 0 ? (
                <div className="empty-state">No pending changes found.</div>
              ) : (
                changes.map((change, idx) => (
                  <div key={idx} className={`change-card ${change.type}`}>
                    <div className="change-meta">
                      <span className="change-type">{change.type}</span>
                      <span className="change-author">{change.author}</span>
                    </div>

                    <div className="change-content">
                      {change.type === 'update' ? (
                        <div className="update-diff">
                          <span className="diff-old">{change.original}</span>
                          <span className="diff-arrow">→</span>
                          <span className="diff-new">{change.new}</span>
                        </div>
                      ) : (
                        `"${change.text}"`
                      )}
                    </div>

                    <div className="change-context">
                      Context: {change.context}
                    </div>
                    <div className="change-actions">
                      <button
                        className="action-btn accept"
                        onClick={() => handleAction(change, 'accept')}
                        disabled={processing}
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button
                        className="action-btn reject"
                        onClick={() => handleAction(change, 'reject')}
                        disabled={processing}
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
