console.log('🚀 Stratus Hue Debug - Plugin starting...');

try {
  // Simple UI without external dependencies
  figma.showUI(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Stratus Hue Debug</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          padding: 16px; 
          margin: 0;
          background: #2c2c2c;
          color: white;
        }
        .status { 
          padding: 8px; 
          background: #4a4a4a; 
          border-radius: 4px; 
          margin: 8px 0;
        }
        button {
          background: #0066cc;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <h2>Stratus Hue Debug</h2>
      <div class="status" id="status">Plugin loaded successfully!</div>
      <button onclick="testFunction()">Test Function</button>
      
      <script>
        console.log('🎨 UI script loaded');
        
        function testFunction() {
          console.log('Test function called');
          document.getElementById('status').textContent = 'Test function executed!';
          parent.postMessage({ pluginMessage: { type: 'test-action' } }, '*');
        }
        
        // Test that everything is working
        setTimeout(() => {
          console.log('UI initialization complete');
          document.getElementById('status').textContent = 'UI fully initialized!';
        }, 100);
      </script>
    </body>
    </html>
  `, { width: 300, height: 200 });

  figma.ui.onmessage = (msg) => {
    console.log('📨 Received message:', msg);
    
    if (msg.type === 'test-action') {
      console.log('✅ Test action received');
      figma.notify('Debug plugin working correctly!');
    }
  };

  console.log('✅ Plugin initialized successfully');
  
} catch (error) {
  console.error('❌ Plugin initialization failed:', error);
  figma.notify('Plugin failed to initialize: ' + error.message);
}