import asyncio
import logging
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client

# logging.basicConfig(level=logging.DEBUG)

async def test_live_connection():
    sse_url = "https://beata-discriminantal-sirena.ngrok-free.dev/sse"
    print(f"🔌 Connecting to {sse_url} ...")
    try:
        async with sse_client(sse_url) as (read_stream, write_stream):
            print("✅ Transport Connected!")
            async with ClientSession(read_stream, write_stream) as session:
                print("🔄 Initializing Session...")
                await session.initialize()
                print("✅ Session Initialized!")
                print("📨 Sending 'list_tools' request...")
                tools = await session.list_tools()
                print(f"🎉 Received Response: Found {len(tools.tools)} tools")
                for tool in tools.tools:
                    print(f"   - 🛠️  {tool.name}")
                
                print("📨 Sending 'resources/read' request...")
                try:
                    res = await session.read_resource("ui://widget/document-editor.html")
                    print(f"🎉 Read Resource Success! Content length: {len(res.contents[0].text)}")
                except Exception as e:
                    print(f"❌ Read Resource Failed: {e}")

                return True
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_live_connection())
