import React, { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8787/api'

function App() {
    const [suggestions, setSuggestions] = useState([])
    const [docId, setDocId] = useState(null)
    const [selectedSuggestions, setSelectedSuggestions] = useState(new Set())
    const [downloadUrl, setDownloadUrl] = useState(null)
    const [status, setStatus] = useState('idle')

    // Standalone mode state
    const [isStandalone, setIsStandalone] = useState(false)
    const [file, setFile] = useState(null)
    const [editRequest, setEditRequest] = useState('')
    const [uploading, setUploading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)

    // Detect if running in standalone mode (no ChatGPT)
    useEffect(() => {
        setIsStandalone(!window.openai)
    }, [])

    // Initialize from ChatGPT's toolOutput
    useEffect(() => {
        const initialData = window.openai?.toolOutput
        if (initialData?.suggestions) {
            setSuggestions(initialData.suggestions)
            setDocId(initialData.doc_id)
        }
    }, [])

    // Listen for updates from ChatGPT
    useEffect(() => {
        const handleSetGlobals = (event) => {
            const globals = event.detail?.globals
            if (!globals?.toolOutput) return

            if (globals.toolOutput.suggestions) {
                setSuggestions(globals.toolOutput.suggestions)
                setDocId(globals.toolOutput.doc_id)
            }

            if (globals.toolOutput.download_url) {
                setDownloadUrl(globals.toolOutput.download_url)
                setStatus('completed')
            }
        }

        window.addEventListener('openai:set_globals', handleSetGlobals, {
            passive: true,
        })

        return () => {
            window.removeEventListener('openai:set_globals', handleSetGlobals)
        }
    }, [])

    // Standalone mode: Upload file
    const handleFileUpload = async () => {
        if (!file || !editRequest) {
            alert('Please select a file and enter an edit request')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // Upload document
            const uploadRes = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            })
            const uploadData = await uploadRes.json()

            if (!uploadRes.ok) {
                throw new Error(uploadData.error || 'Upload failed')
            }

            setDocId(uploadData.doc_id)
            setUploading(false)
            setAnalyzing(true)

            // Analyze document
            const analyzeRes = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_id: uploadData.doc_id,
                    request: editRequest,
                }),
            })
            const analyzeData = await analyzeRes.json()

            if (!analyzeRes.ok) {
                throw new Error(analyzeData.error || 'Analysis failed')
            }

            setSuggestions(analyzeData.suggestions)
            setAnalyzing(false)
        } catch (error) {
            console.error('Error:', error)
            alert(`Error: ${error.message}`)
            setUploading(false)
            setAnalyzing(false)
        }
    }

    const toggleSuggestion = (suggestionId) => {
        setSelectedSuggestions((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(suggestionId)) {
                newSet.delete(suggestionId)
            } else {
                newSet.add(suggestionId)
            }
            return newSet
        })
    }

    const handleApplyChanges = async () => {
        if (!docId || selectedSuggestions.size === 0) return

        setStatus('applying')

        // Standalone mode: Use REST API
        if (isStandalone) {
            try {
                const response = await fetch(`${API_BASE}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doc_id: docId,
                        suggestion_ids: Array.from(selectedSuggestions),
                    }),
                })
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Apply failed')
                }

                setDownloadUrl(`http://localhost:8787${data.download_url}`)
                setStatus('completed')
            } catch (error) {
                console.error('Error applying changes:', error)
                setStatus('error')
            }
        } else {
            // ChatGPT mode: Use MCP tool
            if (window.openai?.callTool) {
                try {
                    const response = await window.openai.callTool('apply_changes', {
                        doc_id: docId,
                        suggestion_ids: Array.from(selectedSuggestions),
                    })

                    if (response?.structuredContent?.download_url) {
                        setDownloadUrl(response.structuredContent.download_url)
                        setStatus('completed')
                    }
                } catch (error) {
                    console.error('Error applying changes:', error)
                    setStatus('error')
                }
            }
        }
    }

    if (suggestions.length === 0) {
        return (
            <div className="container">
                <div className="empty-state">
                    <h2>📄 Document Editor</h2>

                    {isStandalone ? (
                        <>
                            <p>Upload a Word document and request edits</p>
                            <div className="upload-form">
                                <input
                                    type="file"
                                    accept=".docx"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="file-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Enter edit request (e.g., 'make it more formal')"
                                    value={editRequest}
                                    onChange={(e) => setEditRequest(e.target.value)}
                                    className="text-input"
                                />
                                <button
                                    onClick={handleFileUpload}
                                    disabled={!file || !editRequest || uploading || analyzing}
                                    className="btn-primary"
                                >
                                    {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload & Analyze'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Upload a Word document and ask ChatGPT to suggest edits!</p>
                            <p className="hint">
                                Try: "Make this document more formal" or "Fix grammar issues"
                            </p>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <header className="header">
                <h2>📝 Suggested Edits</h2>
                <p className="subtitle">
                    {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found
                </p>
            </header>

            <div className="suggestions-list">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className={`suggestion-card ${selectedSuggestions.has(suggestion.id) ? 'selected' : ''
                            }`}
                    >
                        <label className="suggestion-label">
                            <input
                                type="checkbox"
                                checked={selectedSuggestions.has(suggestion.id)}
                                onChange={() => toggleSuggestion(suggestion.id)}
                            />
                            <div className="suggestion-content">
                                <div className="text-comparison">
                                    <div className="text-block original">
                                        <span className="label">Original:</span>
                                        <p>{suggestion.original}</p>
                                    </div>
                                    <div className="arrow">→</div>
                                    <div className="text-block suggested">
                                        <span className="label">Suggested:</span>
                                        <p>{suggestion.suggested}</p>
                                    </div>
                                </div>
                                <div className="reason">
                                    <span className="reason-icon">💡</span>
                                    {suggestion.reason}
                                </div>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            <div className="action-bar">
                <button
                    className="btn-primary"
                    onClick={handleApplyChanges}
                    disabled={selectedSuggestions.size === 0 || status === 'applying'}
                >
                    {status === 'applying'
                        ? 'Applying Changes...'
                        : `Apply ${selectedSuggestions.size} Selected Change${selectedSuggestions.size !== 1 ? 's' : ''
                        }`}
                </button>

                {downloadUrl && (
                    <a href={downloadUrl} download className="btn-download">
                        ⬇️ Download Modified Document
                    </a>
                )}
            </div>

            {status === 'completed' && (
                <div className="success-message">
                    ✅ Changes applied successfully! Download your document above.
                </div>
            )}

            {status === 'error' && (
                <div className="error-message">
                    ❌ Error applying changes. Please try again.
                </div>
            )}
        </div>
    )
}

export default App

