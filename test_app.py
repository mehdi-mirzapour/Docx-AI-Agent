#!/usr/bin/env python3
"""
Automated test script for the Document Editor application.
Uses files from tests/1/ directory to test the full workflow.
"""

import requests
import time
import sys
from pathlib import Path

# Configuration
API_BASE = "http://localhost:8787/api"
SCRIPT_DIR = Path(__file__).parent.absolute()
TEST_DIR = SCRIPT_DIR / "tests" / "1"
QUERY_FILE = TEST_DIR / "query.txt"
DOC_FILE = TEST_DIR / "Azure.docx"
OUTPUT_DIR = TEST_DIR / "output"

def wait_for_server(max_attempts=30):
    """Wait for the server to be ready."""
    print("Waiting for server to start...")
    for i in range(max_attempts):
        try:
            response = requests.get("http://localhost:8787/")
            if response.status_code == 200:
                print("✅ Server is ready!")
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
        print(f"  Attempt {i+1}/{max_attempts}...")
    print("❌ Server failed to start")
    return False

def read_query():
    """Read the query from query.txt."""
    with open(QUERY_FILE, 'r') as f:
        query = f.read().strip()
    print(f"📝 Query: {query}")
    return query

def upload_document():
    """Upload the document to the server."""
    print(f"\n📤 Uploading {DOC_FILE.name}...")
    
    with open(DOC_FILE, 'rb') as f:
        files = {'file': (DOC_FILE.name, f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post(f"{API_BASE}/upload", files=files)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.text}")
        sys.exit(1)
    
    data = response.json()
    print(f"✅ Uploaded successfully!")
    print(f"   Doc ID: {data['doc_id']}")
    print(f"   Word count: {data['metadata']['word_count']}")
    print(f"   Paragraphs: {data['metadata']['paragraph_count']}")
    return data['doc_id']

def analyze_document(doc_id, query):
    """Analyze the document and get suggestions."""
    print(f"\n🔍 Analyzing document...")
    
    response = requests.post(
        f"{API_BASE}/analyze",
        json={"doc_id": doc_id, "request": query}
    )
    
    if response.status_code != 200:
        print(f"❌ Analysis failed: {response.text}")
        sys.exit(1)
    
    data = response.json()
    suggestions = data['suggestions']
    
    print(f"✅ Analysis complete!")
    print(f"   Found {len(suggestions)} suggestions")
    
    # Display suggestions
    for i, sug in enumerate(suggestions, 1):
        print(f"\n   Suggestion {i}:")
        print(f"   Original:  {sug['original'][:80]}...")
        print(f"   Suggested: {sug['suggested'][:80]}...")
        print(f"   Reason:    {sug['reason']}")
    
    return suggestions

def apply_changes(doc_id, suggestions):
    """Apply all suggestions to the document."""
    if not suggestions:
        print("\n⚠️  No suggestions to apply")
        return None
    
    print(f"\n✏️  Applying {len(suggestions)} changes...")
    
    suggestion_ids = [sug['id'] for sug in suggestions]
    response = requests.post(
        f"{API_BASE}/apply",
        json={"doc_id": doc_id, "suggestion_ids": suggestion_ids}
    )
    
    if response.status_code != 200:
        print(f"❌ Apply failed: {response.text}")
        sys.exit(1)
    
    data = response.json()
    print(f"✅ Changes applied successfully!")
    print(f"   Applied count: {data['applied_count']}")
    
    return data['download_url']

def download_document(download_url):
    """Download the modified document."""
    print(f"\n⬇️  Downloading modified document...")
    
    full_url = f"http://localhost:8787{download_url}"
    response = requests.get(full_url)
    
    if response.status_code != 200:
        print(f"❌ Download failed: {response.text}")
        sys.exit(1)
    
    # Save to output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    output_file = OUTPUT_DIR / "Azure_modified.docx"
    
    with open(output_file, 'wb') as f:
        f.write(response.content)
    
    print(f"✅ Downloaded to: {output_file}")
    return output_file

def main():
    """Run the complete test workflow."""
    print("=" * 60)
    print("Document Editor - Automated Test")
    print("=" * 60)
    
    # Check if server is running
    if not wait_for_server():
        print("\n⚠️  Please start the server first:")
        print("   cd backend && python server.py")
        sys.exit(1)
    
    # Read query
    query = read_query()
    
    # Upload document
    doc_id = upload_document()
    
    # Analyze document
    suggestions = analyze_document(doc_id, query)
    
    # Apply changes
    download_url = apply_changes(doc_id, suggestions)
    
    # Download modified document
    if download_url:
        output_file = download_document(download_url)
        
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print("=" * 60)
        print(f"\nModified document saved to: {output_file}")
    else:
        print("\n" + "=" * 60)
        print("⚠️  Test completed with no changes")
        print("=" * 60)

if __name__ == "__main__":
    main()
